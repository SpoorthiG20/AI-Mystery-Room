import { GoogleGenAI } from '@google/genai'
import { getGeminiModels, getGeminiRetryConfig } from '../../config/ai.js'
import {
  generatedCaseJsonSchema,
  validateCaseIntegrity,
} from '../../validators/schemas.js'
import { retryDelayMs, retryAfterDelayMs } from './retry.js'

const difficultyGuidance = {
  easy: 'Exactly 3 suspects and at least 5 meaningful, mutually supporting clues.',
  medium:
    'Exactly 4 suspects and at least 7 meaningful, mutually supporting clues.',
  hard: 'Exactly 5 suspects and at least 9 meaningful clues with layered but fair contradictions.',
}

const MODEL_CACHE_TTL_MS = 10 * 60 * 1000
const REDIRECTED_MODEL_IDS = new Map([
  ['gemini-3.5-flash', 'gemini-3.6-flash'],
  ['gemini-3.7-flash', 'gemini-3.8-flash'],
])
let modelCache = { expiresAt: 0, names: [] }

export function clearGeminiModelCache() {
  modelCache = { expiresAt: 0, names: [] }
}

function safeFailureDetails(error) {
  const status = Number(error?.status ?? error?.statusCode)
  const retryAfter = retryAfterDelayMs(error)
  const issues = Array.isArray(error?.issues)
    ? error.issues.map(({ path = [], code }) => ({
        path: path.join('.'),
        code,
      }))
    : undefined
  const providerMessage = String(error?.message || '')
  const dailyQuotaExceeded =
    status === 429 &&
    /per day limit exceeded|daily quota|requests per day|quota exceeded for metric/i.test(
      providerMessage,
    )
  const safeMessage = dailyQuotaExceeded
    ? 'Daily Gemini request quota exceeded.'
    : status === 429
      ? 'Gemini request rate or quota limit reached.'
      : status === 503
        ? 'Gemini service temporarily unavailable.'
        : error?.name === 'ZodError'
          ? 'Generated response failed schema validation.'
          : error?.name === 'SyntaxError'
            ? 'Generated response was not valid JSON.'
            : status
              ? `Gemini request failed with HTTP ${status}.`
              : 'Gemini request failed.'

  return {
    type: error?.name || typeof error,
    ...(Number.isFinite(status) && status > 0 ? { status } : {}),
    ...(retryAfter !== undefined
      ? { retryAfterSeconds: Math.ceil(retryAfter / 1000) }
      : {}),
    ...(dailyQuotaExceeded ? { quotaType: 'daily' } : {}),
    message: safeMessage,
    ...(issues?.length ? { issues } : {}),
  }
}

function normalizeModelName(name) {
  return String(name || '').replace(/^models\//, '')
}

function effectiveModelId(name) {
  const normalized = normalizeModelName(name)
  return REDIRECTED_MODEL_IDS.get(normalized) || normalized
}

async function listAvailableGenerateContentModels(ai) {
  if (modelCache.expiresAt > Date.now()) return modelCache.names
  const pager = await ai.models.list()
  const names = []
  for await (const model of pager) {
    if ((model.supportedActions || []).includes('generateContent')) {
      const name = normalizeModelName(model.name)
      if (name) names.push(name)
    }
  }
  modelCache = {
    names: [...new Set(names)],
    expiresAt: Date.now() + MODEL_CACHE_TTL_MS,
  }
  return modelCache.names
}

function selectAlternativeModels(
  { primary, fallback, recovery },
  availableNames,
  maximum,
) {
  const listed = availableNames == null ? null : new Set(availableNames)
  const primaryEffectiveId = effectiveModelId(primary)
  const stableDiscovered = (availableNames || [])
    .filter(
      (name) =>
        /flash/i.test(name) &&
        !/(preview|experimental|live|image|tts|transcrib|omni)/i.test(name),
    )
    .sort((a, b) => {
      const score = (name) =>
        /flash-lite/i.test(name) ? 0 : /flash/i.test(name) ? 1 : 2
      return score(a) - score(b) || a.localeCompare(b)
    })
  const seenEffectiveIds = new Set([primaryEffectiveId])
  const ordered = [...new Set([fallback, ...recovery, ...stableDiscovered])]
  return ordered
    .filter((name) => {
      if (!name || (!listed ? false : !listed.has(name))) return false
      const effectiveId = effectiveModelId(name)
      if (seenEffectiveIds.has(effectiveId)) return false
      seenEffectiveIds.add(effectiveId)
      return true
    })
    .slice(0, maximum)
}

function generationPrompt(scenario, difficulty) {
  return `Create a fair, entirely fictional mystery case from this scenario: ${scenario}\nDifficulty: ${difficulty}. Requirements: ${difficultyGuidance[difficulty]} There must be exactly one culprit and one internally consistent canonical solution. Use stable, unique IDs (lowercase kebab-case). Every evidence item references a valid timeline event and valid suspects. The public timeline and evidence may contain claims and uncertainty but must not state the culprit. Canonical solution belongs only in the solution object. Include evidence that supports the solution and plausible red herrings; ensure the solution is solvable from public evidence. Do not include real personal data. Return only the requested JSON.`
}

async function generateWithModel(
  ai,
  model,
  scenario,
  difficulty,
  attempts,
  retryConfig,
  sleep,
) {
  let repairNote = ''
  let lastError
  let lastDiagnostic
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `${generationPrompt(scenario, difficulty)}${repairNote}`,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: generatedCaseJsonSchema,
        },
      })
      if (!response.text) {
        const error = new Error('The AI returned an empty response.')
        error.code = 'EMPTY_RESPONSE'
        throw error
      }
      const generated = validateCaseIntegrity(
        JSON.parse(response.text),
        difficulty,
      )
      console.info(
        '[Gemini generation] valid case generated',
        JSON.stringify({ model }),
      )
      return generated
    } catch (error) {
      lastError = error
      const failure = safeFailureDetails(error)
      lastDiagnostic = failure
      console.error(
        '[Gemini generation] attempt failed',
        JSON.stringify({ model, attempt: attempt + 1, ...failure }),
      )
      if ([400, 401, 403, 404].includes(failure.status)) break
      if (failure.status === 429 && failure.quotaType === 'daily') break

      repairNote = `\nYour previous response was empty or invalid. Regenerate the entire case and satisfy every requested field and consistency rule.`
      if (
        attempt < attempts - 1 &&
        [429, 500, 502, 503, 504].includes(failure.status)
      ) {
        const delay = retryDelayMs(error, attempt, retryConfig)
        if (delay === null) {
          lastDiagnostic = { ...failure, retrySuppressed: true }
          break
        }
        await sleep(delay)
      }
    }
  }
  const failure = new Error('Mystery generation failed for this model.')
  failure.cause = lastError
  failure.diagnostic = lastDiagnostic || safeFailureDetails(lastError)
  throw failure
}

function makeGenerationError(failures) {
  const lastFailure = failures.at(-1)
  const status = lastFailure?.diagnostic?.status
  const allUnavailable =
    failures.length > 0 &&
    failures.every(({ diagnostic }) =>
      [404, 500, 502, 503, 504].includes(diagnostic?.status),
    )
  const allModelsBlocked =
    failures.length > 0 &&
    failures.every(
      ({ diagnostic }) =>
        [404, 500, 502, 503, 504].includes(diagnostic?.status) ||
        (diagnostic?.status === 429 && diagnostic?.quotaType === 'daily'),
    )
  const hasUnavailableAlternative = failures.some(({ diagnostic }) =>
    [500, 502, 503, 504].includes(diagnostic?.status),
  )
  let publicStatus = 502
  let message =
    'The mystery could not be generated as a valid case. Please try again.'

  if (status === 429 && lastFailure?.diagnostic?.quotaType === 'daily') {
    publicStatus = 429
    message =
      'Gemini daily request quota is exhausted for the attempted models. Enable billing or retry after the quota resets.'
  } else if (status === 429) {
    publicStatus = 429
    message =
      'Gemini has reached a request rate or quota limit. Wait for the provider retry window, then try again.'
  } else if (status === 401 || status === 403) {
    publicStatus = 503
    message =
      'The Gemini service is not authorized for this request. Check the server API key and model access.'
  } else if (allUnavailable) {
    publicStatus = 503
    message =
      'All available Gemini models are temporarily unavailable. Please retry your mystery shortly.'
  } else if (allModelsBlocked && hasUnavailableAlternative) {
    publicStatus = 503
    message =
      'The primary Gemini model quota is exhausted and available alternatives are temporarily unavailable. Please retry shortly or check your AI Studio quota.'
  }

  const error = new Error(message)
  error.status = publicStatus
  error.retryAfterSeconds = lastFailure?.diagnostic?.retryAfterSeconds
  error.cause = lastFailure?.error
  error.diagnostic = {
    models: failures.map(({ model, diagnostic }) => ({ model, ...diagnostic })),
  }
  return error
}

export async function generateMystery(
  scenario,
  difficulty,
  clientOverride,
  options = {},
) {
  if (!process.env.GEMINI_API_KEY && !clientOverride) {
    const error = new Error(
      'Mystery generation is unavailable until GEMINI_API_KEY is configured on the server.',
    )
    error.status = 503
    throw error
  }

  const ai =
    clientOverride || new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const { primary, fallback, recovery } = getGeminiModels()
  const retryConfig = { ...getGeminiRetryConfig(), ...options.retryConfig }
  const sleep =
    options.sleep ||
    ((duration) => new Promise((resolve) => setTimeout(resolve, duration)))
  const listModels = options.listModels || listAvailableGenerateContentModels
  const failures = []
  let modelNames

  try {
    return await generateWithModel(
      ai,
      primary,
      scenario,
      difficulty,
      retryConfig.attemptsPerModel,
      retryConfig,
      sleep,
    )
  } catch (error) {
    failures.push({ model: primary, error, diagnostic: error.diagnostic })
  }

  const primaryStatus = failures[0].diagnostic?.status
  if (
    (primaryStatus === 429 && failures[0].diagnostic?.quotaType !== 'daily') ||
    failures[0].diagnostic?.retrySuppressed
  ) {
    throw makeGenerationError(failures)
  }
  if (
    ![503, 404].includes(primaryStatus) &&
    !(primaryStatus === 429 && failures[0].diagnostic?.quotaType === 'daily')
  ) {
    throw makeGenerationError(failures)
  }

  try {
    modelNames = await listModels(ai)
    console.info(
      '[Gemini generation] model discovery complete',
      JSON.stringify({ generateContentModelCount: modelNames.length }),
    )
  } catch (error) {
    const diagnostic = safeFailureDetails(error)
    console.warn(
      '[Gemini generation] model discovery failed',
      JSON.stringify(diagnostic),
    )
    if (
      diagnostic.status === 429 ||
      diagnostic.status === 401 ||
      diagnostic.status === 403
    ) {
      failures.push({ model: 'models.list', error, diagnostic })
      throw makeGenerationError(failures)
    }
    modelNames = null
  }

  const alternatives = selectAlternativeModels(
    { primary, fallback, recovery },
    modelNames,
    retryConfig.maxRecoveryModels,
  )
  console.info(
    '[Gemini generation] trying verified alternatives',
    JSON.stringify({ models: alternatives }),
  )
  for (const model of alternatives) {
    try {
      const alternativeAttempts =
        primaryStatus === 429 ? 1 : retryConfig.attemptsPerModel
      return await generateWithModel(
        ai,
        model,
        scenario,
        difficulty,
        alternativeAttempts,
        retryConfig,
        sleep,
      )
    } catch (error) {
      failures.push({ model, error, diagnostic: error.diagnostic })
      if (
        (error.diagnostic?.status === 429 &&
          error.diagnostic?.quotaType !== 'daily') ||
        error.diagnostic?.status === 401 ||
        error.diagnostic?.status === 403 ||
        error.diagnostic?.retrySuppressed
      ) {
        throw makeGenerationError(failures)
      }
    }
  }
  throw makeGenerationError(failures)
}
