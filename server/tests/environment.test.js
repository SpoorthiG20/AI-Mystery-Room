import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadServerEnvironment } from '../config/environment.js'
import { DEFAULT_GEMINI_MODEL, DEFAULT_GEMINI_RECOVERY_MODELS, getGeminiModels } from '../config/ai.js'

const protectedKeys = ['MONGODB_URI', 'SESSION_SECRET', 'GEMINI_API_KEY', 'GEMINI_MODEL', 'GEMINI_FALLBACK_MODEL', 'GEMINI_RECOVERY_MODELS']

async function withCleanEnvironment(callback) {
  const previous = Object.fromEntries(protectedKeys.map((key) => [key, process.env[key]]))
  for (const key of protectedKeys) delete process.env[key]
  try { await callback() } finally {
    for (const key of protectedKeys) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  }
}

test('loads MongoDB, session, and Gemini variables from the project-root .env', async () => {
  await withCleanEnvironment(async () => {
    const base = await mkdtemp(join(tmpdir(), 'ai-mystery-env-'))
    const projectRoot = join(base, 'AI-mystery')
    await mkdir(projectRoot)
    await writeFile(join(projectRoot, '.env'), 'MONGODB_URI=mongodb://test.invalid/test\nSESSION_SECRET=unit-test-session-secret\nGEMINI_API_KEY=unit-test-gemini-key\nGEMINI_MODEL=gemini-3.5-flash\nGEMINI_FALLBACK_MODEL=gemini-3.6-flash\nGEMINI_RECOVERY_MODELS=gemini-3.5-flash-lite,gemini-3.1-flash-lite\n')
    try {
      const loaded = loadServerEnvironment(projectRoot)
      assert.deepEqual(loaded, [join(projectRoot, '.env')])
      assert.equal(process.env.MONGODB_URI, 'mongodb://test.invalid/test')
      assert.equal(process.env.SESSION_SECRET, 'unit-test-session-secret')
      assert.equal(process.env.GEMINI_API_KEY, 'unit-test-gemini-key')
      assert.equal(process.env.GEMINI_MODEL, 'gemini-3.5-flash')
      assert.deepEqual(getGeminiModels(), { primary: 'gemini-3.5-flash', fallback: 'gemini-3.6-flash', recovery: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'] })
      assert.notEqual(getGeminiModels().primary, DEFAULT_GEMINI_MODEL)
      assert.notDeepEqual(getGeminiModels().recovery, DEFAULT_GEMINI_RECOVERY_MODELS)
    } finally { await rm(base, { recursive: true, force: true }) }
  })
})

test('supports the explicitly stated sibling AI-mystery.env location without moving it', async () => {
  await withCleanEnvironment(async () => {
    const base = await mkdtemp(join(tmpdir(), 'ai-mystery-env-'))
    const projectRoot = join(base, 'AI-mystery')
    await mkdir(projectRoot)
    await writeFile(join(base, 'AI-mystery.env'), 'MONGODB_URI=mongodb://fallback.invalid/test\nSESSION_SECRET=fallback-session-secret\nGEMINI_API_KEY=fallback-gemini-key\nGEMINI_MODEL=gemini-sibling-model\n')
    try {
      const loaded = loadServerEnvironment(projectRoot)
      assert.deepEqual(loaded, [join(base, 'AI-mystery.env')])
      assert.equal(process.env.MONGODB_URI, 'mongodb://fallback.invalid/test')
      assert.equal(process.env.SESSION_SECRET, 'fallback-session-secret')
      assert.equal(process.env.GEMINI_API_KEY, 'fallback-gemini-key')
      assert.equal(process.env.GEMINI_MODEL, 'gemini-sibling-model')
    } finally { await rm(base, { recursive: true, force: true }) }
  })
})

test('an already-set process variable intentionally takes precedence over project .env', async () => {
  const previousModel = process.env.GEMINI_MODEL
  process.env.GEMINI_MODEL = 'shell-configured-model'
  const base = await mkdtemp(join(tmpdir(), 'ai-mystery-env-'))
  const projectRoot = join(base, 'AI-mystery')
  await mkdir(projectRoot)
  await writeFile(join(projectRoot, '.env'), 'GEMINI_MODEL=gemini-3.5-flash\n')
  try {
    loadServerEnvironment(projectRoot)
    assert.equal(process.env.GEMINI_MODEL, 'shell-configured-model')
  } finally {
    if (previousModel === undefined) delete process.env.GEMINI_MODEL
    else process.env.GEMINI_MODEL = previousModel
    await rm(base, { recursive: true, force: true })
  }
})
