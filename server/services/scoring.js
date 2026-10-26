export const baseScores = { easy: 100, medium: 150, hard: 200 }

export function calculateScore({ difficulty, correct, submittedEvidenceIds, allowedEvidenceIds, hintsUsed }) {
  const uniqueAllowed = new Set(allowedEvidenceIds)
  const relevantEvidenceIds = [...new Set(submittedEvidenceIds)].filter((id) => uniqueAllowed.has(id))
  const base = correct ? baseScores[difficulty] : 0
  const cluePoints = relevantEvidenceIds.length * 5
  const hintPenalty = Math.max(0, hintsUsed) * 10
  return { score: Math.max(0, base + cluePoints - hintPenalty), base, cluePoints, hintPenalty, relevantEvidenceIds }
}
