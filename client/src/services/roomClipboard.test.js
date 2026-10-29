import test from 'node:test'
import assert from 'node:assert/strict'
import { writeRoomCodeToClipboard } from './roomClipboard.js'

test('room code copy writes the displayed code to the clipboard', async () => {
  let copied
  await writeRoomCodeToClipboard('A1B2C3', {
    writeText: async (value) => {
      copied = value
    },
  })
  assert.equal(copied, 'A1B2C3')
})

test('room code copy reports clipboard failures to the page', async () => {
  await assert.rejects(
    writeRoomCodeToClipboard('A1B2C3', {
      writeText: async () => {
        throw new Error('denied')
      },
    }),
    /denied/,
  )
  await assert.rejects(
    writeRoomCodeToClipboard('A1B2C3', null),
    /Clipboard access is unavailable/,
  )
})
