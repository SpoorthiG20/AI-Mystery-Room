import test from 'node:test'
import assert from 'node:assert/strict'
import { api } from './api.js'

test('API client preserves a safe backend error message for the page to display', async () => {
  const previousFetch = globalThis.fetch
  let requestOptions
  globalThis.fetch = async (_url, options) => { requestOptions = options; return new Response(JSON.stringify({ error: 'Gemini is temporarily unavailable. Please try again in a moment.' }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' },
  }) }
  try {
    await assert.rejects(api('/cases/generate', { method: 'POST', headers: { 'Idempotency-Key': 'stable-request-key-12345678' }, body: '{}' }), (error) => {
      assert.equal(error.message, 'Gemini is temporarily unavailable. Please try again in a moment.')
      return true
    })
    assert.equal(requestOptions.headers['Idempotency-Key'], 'stable-request-key-12345678')
    assert.equal(requestOptions.headers['Content-Type'], 'application/json')
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('API client provides an HTTP-specific message when an error body is not JSON', async () => {
  const previousFetch = globalThis.fetch
  globalThis.fetch = async () => new Response('upstream proxy error', { status: 502 })
  try {
    await assert.rejects(api('/cases/generate'), (error) => {
      assert.equal(error.message, 'The server could not complete the request (HTTP 502). Please try again.')
      return true
    })
  } finally {
    globalThis.fetch = previousFetch
  }
})
