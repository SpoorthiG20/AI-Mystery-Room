const apiBase = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '')

export function apiErrorMessage(data, status) {
  if (typeof data?.error === 'string' && data.error.trim()) return data.error
  if (typeof data?.message === 'string' && data.message.trim()) return data.message
  return `The server could not complete the request (HTTP ${status}). Please try again.`
}

export async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  let data = {}
  if (response.status !== 204) {
    try {
      data = await response.json()
    } catch {
      if (!response.ok) throw new Error(apiErrorMessage(null, response.status))
      throw new Error('The server returned an unreadable response. Please try again.')
    }
  }
  if (!response.ok) throw new Error(apiErrorMessage(data, response.status))
  return data
}
