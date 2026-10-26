import test from 'node:test'
import assert from 'node:assert/strict'
import { generateMystery, clearGeminiModelCache } from '../services/ai/generateCase.js'

function validCase() {
  const suspects = Array.from({ length: 3 }, (_, index) => ({
    id: `suspect-${index}`, name: `Suspect ${index}`, role: 'Guest', personality: 'Observant and careful',
    motive: 'A private disagreement', alibi: 'Was in the east hall', relationships: [], knownInformation: ['The gallery was busy.'],
  }))
  const timeline = Array.from({ length: 5 }, (_, index) => ({
    id: `event-${index}`, time: `${8 + index}:00 pm`, event: `A documented event number ${index} occurs.`,
    suspectIds: [suspects[index % 3].id], evidenceIds: [`clue-${index}`], certainty: 'confirmed',
  }))
  const evidence = timeline.map((event, index) => ({
    id: `clue-${index}`, title: `Record ${index}`, type: 'document', content: 'A fictional record with a detail to compare.',
    source: 'Case file', timestamp: event.time, relatedSuspectIds: event.suspectIds, location: 'Gallery',
    reliability: { label: 'high', reason: 'A directly recorded event.' }, eventId: event.id,
  }))
  return {
    title: 'The gallery mystery', summary: 'A detailed fictional case summary that gives the investigator an opening.',
    incidentType: 'Missing object', location: 'Gallery', incidentTime: 'Late evening', suspects, evidence, timeline,
    solution: { culpritId: suspects[0].id, motive: 'A longstanding rivalry', method: 'A quiet switch during the crowd',
      explanation: 'The timing, the access record, and a witness statement point to one consistent account of the event.',
      canonicalTimeline: timeline, secretFacts: ['A private detail known only to the culprit.'], scoringEvidenceIds: ['clue-0'] },
    crimeScene: { description: 'A fictional gallery prepared for a busy evening event.', hotspots: [] },
  }
}

async function withTestModels(callback) {
  const keys = ['GEMINI_API_KEY', 'GEMINI_MODEL', 'GEMINI_FALLBACK_MODEL', 'GEMINI_RECOVERY_MODELS']
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  process.env.GEMINI_API_KEY = 'unit-test-key'
  process.env.GEMINI_MODEL = 'primary-test-model'
  process.env.GEMINI_FALLBACK_MODEL = 'fallback-test-model'
  delete process.env.GEMINI_RECOVERY_MODELS
  clearGeminiModelCache()
  try { await callback() } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
    clearGeminiModelCache()
  }
}

function silenceLogs(callback) {
  const original = { error: console.error, warn: console.warn, info: console.info }
  console.error = () => {}
  console.warn = () => {}
  console.info = () => {}
  return Promise.resolve().then(callback).finally(() => {
    console.error = original.error
    console.warn = original.warn
    console.info = original.info
  })
}

function unavailable(status, headers) {
  const error = new Error(`Gemini unavailable ${status}`)
  error.status = status
  if (headers) error.headers = headers
  return error
}

test('primary success uses configured model and structured output with Zod validation', async () => {
  await withTestModels(async () => {
    process.env.GEMINI_MODEL = 'gemini-3.5-flash'
    let request
    const client = { models: { generateContent: async (value) => { request = value; return { text: JSON.stringify(validCase()) } } } }
    const generated = await generateMystery('A detailed fictional gallery scenario with a missing object.', 'easy', client)
    assert.equal(request.model, 'gemini-3.5-flash')
    assert.equal(request.config.responseMimeType, 'application/json')
    assert.ok(request.config.responseJsonSchema)
    assert.equal(generated.solution.culpritId, 'suspect-0')
    assert.equal(generated.evidence.length, 5)
  })
})

test('invalid structured output receives one bounded repair attempt and reports its validation path', async () => {
  await withTestModels(async () => silenceLogs(async () => {
    let calls = 0
    const client = { models: { generateContent: async () => { calls += 1; return { text: '{"title":"incomplete"}' } } } }
    await assert.rejects(generateMystery('A detailed fictional gallery scenario with a missing object.', 'easy', client, {
      listModels: async () => [], sleep: async () => {},
    }), (error) => {
      assert.equal(error.status, 502)
      assert.equal(error.diagnostic.models[0].type, 'ZodError')
      assert.ok(error.diagnostic.models[0].issues.some((issue) => issue.path === 'summary'))
      return true
    })
    assert.equal(calls, 2)
  }))
})

test('provider diagnostics never log raw scenario text or secret-like provider error content', async () => {
  await withTestModels(async () => {
    const logged = []
    const originalError = console.error
    console.error = (...args) => logged.push(args.join(' '))
    try {
      const client = { models: { generateContent: async () => {
        const error = unavailable(503)
        error.message = 'provider detail contains PRIVATE_STORY_MARKER and API_KEY_MARKER'
        throw error
      } } }
      await assert.rejects(generateMystery('PRIVATE_STORY_MARKER scenario description with enough length for a mystery case.', 'easy', client, {
        listModels: async () => [], sleep: async () => {}, retryConfig: { attemptsPerModel: 1, maxRecoveryModels: 0 },
      }))
      assert.ok(logged.length)
      const diagnostics = logged.join('\n')
      assert.equal(diagnostics.includes('PRIVATE_STORY_MARKER'), false)
      assert.equal(diagnostics.includes('API_KEY_MARKER'), false)
      assert.match(diagnostics, /503/)
    } finally { console.error = originalError }
  })
})

test('primary 503 retries with backoff, lists supported models, and fails over to a verified alternative', async () => {
  await withTestModels(async () => silenceLogs(async () => {
    const attempted = []
    const delays = []
    let listCalls = 0
    const client = { models: { generateContent: async (request) => {
      attempted.push(request.model)
      if (request.model !== 'gemini-3.5-flash-lite') throw unavailable(503)
      assert.ok(request.config.responseJsonSchema)
      return { text: JSON.stringify(validCase()) }
    } } }
    const result = await generateMystery('A detailed fictional gallery scenario with a missing object.', 'easy', client, {
      listModels: async () => { listCalls += 1; return ['fallback-test-model', 'gemini-3.5-flash-lite', 'unsupported-model'] },
      sleep: async (ms) => delays.push(ms),
      retryConfig: { attemptsPerModel: 2, maxRecoveryModels: 2, baseDelayMs: 25, maxBackoffMs: 100, maxRetryAfterMs: 1000 },
    })
    assert.deepEqual(attempted, ['primary-test-model', 'primary-test-model', 'fallback-test-model', 'fallback-test-model', 'gemini-3.5-flash-lite'])
    assert.deepEqual(delays, [25, 25])
    assert.equal(listCalls, 1)
    assert.equal(result.solution.culpritId, 'suspect-0')
  }))
})

test('model discovery excludes models without generateContent support and unlisted fallbacks', async () => {
  await withTestModels(async () => silenceLogs(async () => {
    process.env.GEMINI_RECOVERY_MODELS = 'gemini-3.5-flash-lite'
    const attempted = []
    let listCalls = 0
    const client = {
      models: {
        generateContent: async ({ model }) => {
          attempted.push(model)
          if (model !== 'gemini-3.5-flash-lite') throw unavailable(503)
          return { text: JSON.stringify(validCase()) }
        },
        list: async () => {
          listCalls += 1
          return [
            { name: 'models/fallback-test-model', supportedActions: ['embedContent'] },
            { name: 'models/gemini-3.5-flash-lite', supportedActions: ['generateContent'] },
          ]
        },
      },
    }
    const result = await generateMystery('A detailed fictional gallery scenario with a missing object.', 'easy', client, {
      sleep: async () => {}, retryConfig: { attemptsPerModel: 2, maxRecoveryModels: 2, baseDelayMs: 1, maxBackoffMs: 1, maxRetryAfterMs: 10 },
    })
    assert.deepEqual(attempted, ['primary-test-model', 'primary-test-model', 'gemini-3.5-flash-lite'])
    assert.equal(listCalls, 1)
    assert.equal(result.suspects.length, 3)
  }))
})

test('deprecated primary and its redirected fallback are not attempted as duplicate models', async () => {
  await withTestModels(async () => silenceLogs(async () => {
    process.env.GEMINI_MODEL = 'gemini-3.5-flash'
    process.env.GEMINI_FALLBACK_MODEL = 'gemini-3.6-flash'
    const attempted = []
    const client = {
      models: {
        generateContent: async ({ model }) => {
          attempted.push(model)
          if (model !== 'gemini-3.5-flash-lite') throw unavailable(503)
          return { text: JSON.stringify(validCase()) }
        },
      },
    }
    const result = await generateMystery('A detailed fictional gallery scenario with a missing object.', 'easy', client, {
      listModels: async () => ['gemini-3.6-flash', 'gemini-3.5-flash-lite'], sleep: async () => {},
      retryConfig: { attemptsPerModel: 2, maxRecoveryModels: 2, baseDelayMs: 1, maxBackoffMs: 1, maxRetryAfterMs: 10 },
    })
    assert.deepEqual(attempted, ['gemini-3.5-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'])
    assert.equal(result.suspects.length, 3)
  }))
})

test('429 uses Retry-After and does not fan out to other models', async () => {
  await withTestModels(async () => silenceLogs(async () => {
    const delays = []
    let calls = 0
    let listCalls = 0
    const client = { models: { generateContent: async () => { calls += 1; throw unavailable(429, new Headers({ 'Retry-After': '2' })) } } }
    await assert.rejects(generateMystery('A detailed fictional gallery scenario with a missing object.', 'easy', client, {
      listModels: async () => { listCalls += 1; return ['fallback-test-model'] },
      sleep: async (ms) => delays.push(ms),
      retryConfig: { attemptsPerModel: 2, maxRecoveryModels: 2, baseDelayMs: 25, maxBackoffMs: 100, maxRetryAfterMs: 5000 },
    }), (error) => {
      assert.equal(error.status, 429)
      assert.equal(error.retryAfterSeconds, 2)
      assert.match(error.message, /rate or quota limit/)
      return true
    })
    assert.equal(calls, 2)
    assert.equal(listCalls, 0)
    assert.deepEqual(delays, [2000])
  }))
})

test('daily 429 quota stops primary retries and uses one listed alternative', async () => {
  await withTestModels(async () => silenceLogs(async () => {
    const attempted = []
    const client = { models: { generateContent: async ({ model }) => {
      attempted.push(model)
      if (model === 'primary-test-model') {
        const error = unavailable(429)
        error.message = 'Quota exceeded for metric: generate_content_free_tier_requests; Generate content requests per day limit exceeded on Free Tier.'
        throw error
      }
      return { text: JSON.stringify(validCase()) }
    } } }
    const result = await generateMystery('A detailed fictional gallery scenario with a missing object.', 'easy', client, {
      listModels: async () => ['fallback-test-model'], sleep: async () => {},
      retryConfig: { attemptsPerModel: 2, maxRecoveryModels: 1, baseDelayMs: 1, maxBackoffMs: 1, maxRetryAfterMs: 10 },
    })
    assert.deepEqual(attempted, ['primary-test-model', 'fallback-test-model'])
    assert.equal(result.evidence.length, 5)
  }))
})

test('503 Retry-After beyond the wait cap stops retries rather than retrying early', async () => {
  await withTestModels(async () => silenceLogs(async () => {
    let calls = 0
    const client = { models: { generateContent: async () => { calls += 1; throw unavailable(503, new Headers({ 'retry-after': '60' })) } } }
    await assert.rejects(generateMystery('A detailed fictional gallery scenario with a missing object.', 'easy', client, {
      listModels: async () => ['fallback-test-model'], sleep: async () => {},
      retryConfig: { attemptsPerModel: 2, maxRecoveryModels: 1, baseDelayMs: 25, maxBackoffMs: 100, maxRetryAfterMs: 1000 },
    }), (error) => error.status === 503)
    assert.equal(calls, 1)
  }))
})

test('all listed alternatives returning 503 produce a clear temporary-unavailability error', async () => {
  await withTestModels(async () => silenceLogs(async () => {
    const attempted = []
    const client = { models: { generateContent: async ({ model }) => { attempted.push(model); throw unavailable(503) } } }
    await assert.rejects(generateMystery('A detailed fictional gallery scenario with a missing object.', 'easy', client, {
      listModels: async () => ['fallback-test-model', 'gemini-3.5-flash-lite'], sleep: async () => {},
      retryConfig: { attemptsPerModel: 2, maxRecoveryModels: 2, baseDelayMs: 1, maxBackoffMs: 1, maxRetryAfterMs: 10 },
    }), (error) => {
      assert.equal(error.status, 503)
      assert.match(error.message, /All available Gemini models are temporarily unavailable/)
      assert.deepEqual(error.diagnostic.models.map((item) => item.model), ['primary-test-model', 'fallback-test-model', 'gemini-3.5-flash-lite'])
      return true
    })
    assert.deepEqual(attempted, ['primary-test-model', 'primary-test-model', 'fallback-test-model', 'fallback-test-model', 'gemini-3.5-flash-lite', 'gemini-3.5-flash-lite'])
  }))
})

test('invalid requests and credentials do not trigger model failover', async () => {
  await withTestModels(async () => silenceLogs(async () => {
    let calls = 0
    let listCalls = 0
    const client = { models: { generateContent: async () => { calls += 1; throw unavailable(403) } } }
    await assert.rejects(generateMystery('A detailed fictional gallery scenario with a missing object.', 'easy', client, {
      listModels: async () => { listCalls += 1; return ['fallback-test-model'] }, sleep: async () => {},
    }), (error) => error.status === 503)
    assert.equal(calls, 1)
    assert.equal(listCalls, 0)
  }))
})
