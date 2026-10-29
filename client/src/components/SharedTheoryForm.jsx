import { useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../services/api.js'

export default function SharedTheoryForm({ roomId, room, onSaved }) {
  const [title, setTitle] = useState('')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const theories = [
        ...room.progress.theories,
        { title, explanation, suspectIds: [], evidenceIds: [] },
      ]
      await api(`/rooms/${roomId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          discoveredEvidenceIds: room.progress.discoveredEvidenceIds,
          theories,
        }),
      })
      setTitle('')
      setExplanation('')
      await onSaved()
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="aside-card shared-theory-card">
      <span className="eyebrow">TEAM THEORY NOTES</span>
      <h3>Compare your ideas</h3>
      {room.progress.theories.map((item, index) => (
        <article
          className="shared-theory-note"
          key={`${item.updatedBy}-${index}`}
        >
          <strong>{item.title}</strong>
          <p>{item.explanation}</p>
          <small>Shared hypothesis</small>
        </article>
      ))}
      <form onSubmit={submit}>
        <label className="form-field">
          <span>Theory title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            required
          />
        </label>
        <label className="form-field">
          <span>What connects the details?</span>
          <textarea
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
            maxLength={1500}
          />
        </label>
        {error && <span className="field-error">{error}</span>}
        <button className="button button-soft" disabled={busy}>
          {busy ? (
            'Sharing…'
          ) : (
            <>
              Share theory <Plus size={13} />
            </>
          )}
        </button>
      </form>
    </aside>
  )
}
