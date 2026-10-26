export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'
export const DEFAULT_GEMINI_FALLBACK_MODEL = 'gemini-3.6-flash'
export const DEFAULT_GEMINI_RECOVERY_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
]

export function getGeminiModels() {
  const configuredRecovery = process.env.GEMINI_RECOVERY_MODELS
    ?.split(',')
    .map((model) => model.trim())
    .filter(Boolean)

  return {
    primary: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    fallback: process.env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_GEMINI_FALLBACK_MODEL,
    recovery: configuredRecovery?.length ? [...new Set(configuredRecovery)] : DEFAULT_GEMINI_RECOVERY_MODELS,
  }
}

function boundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

export function getGeminiRetryConfig() {
  return {
    attemptsPerModel: boundedInteger(process.env.GEMINI_ATTEMPTS_PER_MODEL, 2, 1, 3),
    maxRecoveryModels: boundedInteger(process.env.GEMINI_MAX_RECOVERY_MODELS, 2, 0, 4),
    baseDelayMs: boundedInteger(process.env.GEMINI_RETRY_BASE_DELAY_MS, 1000, 100, 10000),
    maxBackoffMs: boundedInteger(process.env.GEMINI_RETRY_MAX_BACKOFF_MS, 4000, 100, 30000),
    maxRetryAfterMs: boundedInteger(process.env.GEMINI_RETRY_AFTER_LIMIT_MS, 15000, 100, 60000),
  }
}
