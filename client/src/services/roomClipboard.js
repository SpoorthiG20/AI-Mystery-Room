export async function writeRoomCodeToClipboard(
  code,
  clipboard = globalThis.navigator?.clipboard,
) {
  if (typeof clipboard?.writeText !== 'function')
    throw new Error('Clipboard access is unavailable.')
  await clipboard.writeText(code)
}
