import { GoogleGenAI } from '@google/genai'
import { getGeminiModels } from '../../config/ai.js'

export async function generateSuspectReply({
  suspect,
  discoveredEvidence,
  question,
}) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error(
      'Suspect conversations are unavailable until GEMINI_API_KEY is configured on the server.',
    )
    error.status = 503
    throw error
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const { primary: model } = getGeminiModels()
  const response = await ai.models.generateContent({
    model,
    contents: `You are roleplaying a fictional mystery suspect. Stay consistent with this public profile and the facts this person knows. Never identify the culprit, reveal hidden case information, or invent facts beyond this profile and the player's discovered evidence. If asked for information outside your knowledge, say so in character. Public profile: ${JSON.stringify(suspect)}. Evidence the player has discovered: ${JSON.stringify(discoveredEvidence)}. Player's question: ${question}`,
    config: { temperature: 0.45 },
  })
  const answer = response.text?.trim()
  if (!answer)
    throw Object.assign(
      new Error('The suspect could not answer right now. Please try again.'),
      { status: 502 },
    )
  return answer.slice(0, 2000)
}
