import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadServerEnvironment } from './config/environment.js'

const serverDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(serverDirectory, '..')
loadServerEnvironment(projectRoot)

const { getGeminiModels } = await import('./config/ai.js')
const { primary: primaryGeminiModel, fallback: fallbackGeminiModel } =
  getGeminiModels()
console.log(
  `Gemini models configured: primary=${primaryGeminiModel}, fallback=${fallbackGeminiModel}`,
)

const { default: app } = await import('./app.js')
const { connectDatabase } = await import('./config/database.js')

const port = Number(process.env.PORT) || 5000

try {
  await connectDatabase()
  app.listen(port, () =>
    console.log(`AI Mystery Room API listening on http://localhost:${port}`),
  )
} catch (error) {
  const code =
    typeof error?.code === 'string' && /^[A-Z0-9_-]{1,64}$/.test(error.code)
      ? `, code=${error.code}`
      : ''
  console.error(`MongoDB connection failed (${error?.name || 'Error'}${code}).`)
  process.exit(1)
}
