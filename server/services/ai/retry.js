function readHeader(headers, name) {
  if (!headers) return undefined
  if (typeof headers.get === 'function') return headers.get(name) || undefined
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())
  return entry?.[1] == null ? undefined : String(entry[1])
}

export function retryAfterDelayMs(error, now = Date.now()) {
  const raw = readHeader(error?.headers || error?.response?.headers, 'retry-after')
  if (!raw) return undefined
  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000)
  const date = Date.parse(raw)
  return Number.isFinite(date) ? Math.max(0, date - now) : undefined
}

export function retryDelayMs(error, retryIndex, config, now = Date.now()) {
  const retryAfter = retryAfterDelayMs(error, now)
  if (retryAfter !== undefined) {
    return retryAfter <= config.maxRetryAfterMs ? retryAfter : null
  }
  return Math.min(config.baseDelayMs * (2 ** retryIndex), config.maxBackoffMs)
}
