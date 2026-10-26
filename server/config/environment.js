import dotenv from 'dotenv'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function getEnvironmentFileCandidates(projectRoot) {
  return [
    resolve(projectRoot, '.env'),
    resolve(projectRoot, '..', 'AI-mystery.env'),
  ]
}

export function loadServerEnvironment(projectRoot) {
  const loadedFiles = []

  for (const envFile of getEnvironmentFileCandidates(projectRoot)) {
    if (!existsSync(envFile)) continue
    const result = dotenv.config({ path: envFile, override: false })
    if (result.error) throw result.error
    loadedFiles.push(envFile)
  }

  return loadedFiles
}
