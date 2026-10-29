import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  Compass,
  Eye,
  EyeOff,
  FileSearch,
  Fingerprint,
  Flag,
  Lightbulb,
  LogOut,
  MapPin,
  Mic,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { LandingNotFound, LandingPage } from './pages/LandingPage.jsx'
import { api } from './services/api.js'
import { createDashboardRequest } from './services/dashboardRequest.js'
import { writeRoomCodeToClipboard } from './services/roomClipboard.js'
import SharedTheoryForm from './components/SharedTheoryForm.jsx'

const AuthContext = createContext(null)
const useAuth = () => useContext(AuthContext)
const suggestions = [
  {
    id: 'necklace',
    title: 'The Missing Necklace',
    description: 'A priceless necklace vanishes during a college festival.',
    story:
      'A priceless necklace disappears during a college cultural festival. The display cabinet was locked, the power flickered briefly, and several volunteers had reasons to be near the exhibition hall.',
    image: '/images/necklace.svg',
    tint: 'mystery-blush',
    tag: 'A curious disappearance',
  },
  {
    id: 'office',
    title: 'The Locked Office',
    description: 'A confidential file disappears from a locked office.',
    story:
      'A confidential file disappears from a locked office overnight. The only key is accounted for, yet three colleagues remember the final hour very differently.',
    image: '/images/office.svg',
    tint: 'mystery-lavender',
    tag: 'A room with one door',
  },
  {
    id: 'alibi',
    title: 'The Midnight Alibi',
    description: 'Three guests give conflicting accounts of the same night.',
    story:
      'After a quiet dinner at an old country house, a valuable locket is missing. Three guests give conflicting accounts of the same hour, and a storm has washed away the garden path.',
    image: '/images/alibi.svg',
    tint: 'mystery-sage',
    tag: 'Three stories, one night',
  },
  {
    id: 'exam',
    title: 'The Exam Paper Leak',
    description: 'An upcoming exam paper appears online before the exam.',
    story:
      'An upcoming exam paper appears online two days before the test. Only a small group had access to the draft, and the first post came from a campus account with no obvious owner.',
    image: '/images/exam.svg',
    tint: 'mystery-butter',
    tag: 'A campus mystery',
  },
]

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true))
  }, [])
  const value = useMemo(
    () => ({
      user,
      ready,
      async login(input) {
        const data = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify(input),
        })
        setUser(data.user)
        return data.user
      },
      async register(input) {
        const data = await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify(input),
        })
        setUser(data.user)
        return data.user
      },
      async logout() {
        await api('/auth/logout', { method: 'POST' })
        setUser(null)
      },
    }),
    [user, ready],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function SiteBrand() {
  return (
    <Link to="/dashboard" className="brand">
      <span className="brand-mark">
        <Fingerprint size={20} />
      </span>
      <span>
        mystery<span className="brand-dot">.</span>
      </span>
    </Link>
  )
}

function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  async function signOut() {
    try {
      await logout()
      navigate('/')
    } catch {
      navigate('/')
    }
  }
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <SiteBrand />
        <nav className="app-nav" aria-label="Main navigation">
          <NavLink to="/dashboard" end>
            My room
          </NavLink>
          <NavLink to="/cases/new" end>
            Create a mystery
          </NavLink>
          <NavLink to="/profile" end>
            Detective profile
          </NavLink>
        </nav>
        <div className="app-user">
          <span className="user-greeting">
            Hello, {user?.name?.split(' ')[0]}
          </span>
          <button
            className="icon-button app-logout-button"
            onClick={signOut}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  )
}

function AppShell({ children }) {
  return (
    <div className="app-surface">
      <AppHeader />
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <SiteBrand />
        <span>A quiet moment. A curious mind.</span>
      </footer>
    </div>
  )
}
function Protected({ children }) {
  const { user, ready } = useAuth()
  if (!ready)
    return (
      <div className="loading-screen">
        <span className="spinner" /> Checking your room…
      </div>
    )
  return user ? (
    <AppShell>{children}</AppShell>
  ) : (
    <Navigate to="/login" replace />
  )
}

function Field({ label, id, error, children }) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
function PasswordInput({ id, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="password-input">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        minLength={autoComplete === 'new-password' ? 10 : undefined}
        required
      />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((state) => !state)}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmation: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/dashboard" replace />
  async function submit(event) {
    event.preventDefault()
    setError('')
    if (isRegister && form.password !== form.confirmation)
      return setError('Your passwords do not match.')
    setBusy(true)
    try {
      await (isRegister ? register(form) : login(form))
      navigate('/dashboard')
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="auth-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={15} /> Back to the beginning
      </Link>
      <section className="auth-card">
        <div className="auth-mark">
          <Fingerprint size={22} />
        </div>
        <div className="eyebrow">
          <span className="eyebrow-line" />
          {isRegister ? 'A PLACE FOR THE CURIOUS' : 'WELCOME BACK'}
        </div>
        <h1>{isRegister ? 'Make yourself at home.' : 'The case can wait.'}</h1>
        <p>
          {isRegister
            ? 'Create an account to keep your cases and discoveries close.'
            : 'Sign in to continue where your curiosity left off.'}
        </p>
        <form onSubmit={submit} className="auth-form">
          {isRegister && (
            <Field label="Your name" id="name">
              <input
                autoComplete="name"
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                minLength="2"
                maxLength="80"
                required
              />
            </Field>
          )}
          <Field label="Email address" id="email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label="Password" id="password">
            <PasswordInput
              id="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          {isRegister && (
            <Field label="Confirm password" id="confirmation">
              <PasswordInput
                id="confirmation"
                autoComplete="new-password"
                value={form.confirmation}
                onChange={(e) =>
                  setForm({ ...form, confirmation: e.target.value })
                }
              />
            </Field>
          )}
          {error && (
            <div className="notice notice-error" role="alert">
              {error}
            </div>
          )}
          <button className="button button-primary full-button" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner spinner-small" /> Please wait…
              </>
            ) : isRegister ? (
              'Create my account'
            ) : (
              'Log in'
            )}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : 'New to the room?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </section>
      <div className="auth-footer">
        Your cases stay private and belong to you.
      </div>
    </div>
  )
}

function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">
          <span className="eyebrow-line" />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-title-action">{action}</div>}
    </div>
  )
}
function StatCard({ label, value, tint, note }) {
  return (
    <div className={`stat-card ${tint}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [roomCode, setRoomCode] = useState('')
  const [roomError, setRoomError] = useState('')
  const [busy, setBusy] = useState(false)
  const loadRequest = useRef(null)
  const dashboardRequest = useMemo(
    () => createDashboardRequest(() => api('/dashboard')),
    [],
  )
  function load() {
    if (loadRequest.current) return loadRequest.current
    setError('')
    setData(null)
    setLoading(true)
    const request = dashboardRequest()
      .then(({ dashboard }) => {
        setData(dashboard)
        setError('')
      })
      .catch((e) => {
        setData(null)
        setError(e.message)
      })
      .finally(() => {
        setLoading(false)
        loadRequest.current = null
      })
    loadRequest.current = request
    return request
  }
  useEffect(() => {
    void load()
  }, [])
  async function createRoom(caseId) {
    try {
      setRoomError('')
      setBusy(true)
      const { room } = await api('/rooms', {
        method: 'POST',
        body: JSON.stringify({ caseId }),
      })
      navigate(`/rooms/${room.id}`)
    } catch (e) {
      setRoomError(e.message)
    } finally {
      setBusy(false)
    }
  }
  async function joinRoom(event) {
    event.preventDefault()
    try {
      setRoomError('')
      setBusy(true)
      const { room } = await api('/rooms/join', {
        method: 'POST',
        body: JSON.stringify({ code: roomCode }),
      })
      navigate(`/rooms/${room.id}`)
    } catch (e) {
      setRoomError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="YOUR DETECTIVE DESK"
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Detective'}.`}
        description="Your cases, notes, and next clue are all right here."
        action={
          <Link className="button button-primary" to="/cases/new">
            <Plus size={16} /> Create mystery
          </Link>
        }
      />
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
          <button onClick={load} disabled={loading}>
            Retry
          </button>
        </div>
      )}
      {roomError && (
        <div className="notice notice-error" role="alert">
          {roomError}
        </div>
      )}
      <div className="stats-grid">
        <StatCard
          label="Cases attempted"
          value={data?.stats?.attempted ?? '—'}
          tint="stat-blush"
          note="Every good detective starts somewhere"
        />
        <StatCard
          label="Cases solved"
          value={data?.stats?.solved ?? '—'}
          tint="stat-sage"
          note="The truths you've uncovered"
        />
        <StatCard
          label="Average score"
          value={data ? Math.round(data.stats.averageScore || 0) : '—'}
          tint="stat-lavender"
          note="Points across your cases"
        />
        <StatCard
          label="Detective rank"
          value={data?.stats?.rank || '—'}
          tint="stat-butter"
          note="A title earned one clue at a time"
        />
      </div>
      <div className="dashboard-columns">
        <section className="panel-section">
          <div className="section-title">
            <div>
              <span className="eyebrow">YOUR CASE FILES</span>
              <h2>Continue investigating</h2>
            </div>
            <Link to="/profile" className="underlined-link">
              See history <ArrowRight size={14} />
            </Link>
          </div>
          {data?.cases?.length ? (
            <div className="case-list">
              {data.cases.map((item) => (
                <article key={item.id} className="case-row">
                  <div className="case-row-icon">
                    <FileSearch size={19} />
                  </div>
                  <div className="case-row-copy">
                    <span className="difficulty-label">
                      {item.difficulty} ·{' '}
                      {item.investigationStatus === 'completed'
                        ? 'VERDICT FILED'
                        : item.investigationId
                          ? 'IN PROGRESS'
                          : 'READY'}
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                  </div>
                  <div className="case-row-actions">
                    {item.investigationId ? (
                      <Link
                        className="button button-primary"
                        to={
                          item.investigationStatus === 'completed'
                            ? `/investigations/${item.investigationId}/result`
                            : `/investigations/${item.investigationId}`
                        }
                      >
                        {item.investigationStatus === 'completed'
                          ? 'View result'
                          : 'Continue'}{' '}
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <Link
                        className="button button-primary"
                        to={`/cases/${item.id}`}
                      >
                        Open case <ArrowRight size={14} />
                      </Link>
                    )}
                    <Link
                      className="button button-soft dashboard-action-edit"
                      to={`/cases/${item.id}/edit`}
                    >
                      <Pencil size={14} /> Edit
                    </Link>
                    {item.investigationStatus !== 'completed' && (
                      <button
                        className="button button-soft dashboard-action-room"
                        onClick={() => createRoom(item.id)}
                        disabled={busy}
                      >
                        <Users size={14} /> Create room
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : data ? (
            <EmptyState
              icon={FileSearch}
              title="No case files yet"
              text="Start with a small mystery and follow it wherever it leads."
              action={
                <Link to="/cases/new" className="button button-primary">
                  Create your first mystery <ArrowRight size={15} />
                </Link>
              }
            />
          ) : (
            <div className="loading-line">
              <span className="spinner spinner-small" />{' '}
              {loading
                ? 'Loading your detective statistics and cases…'
                : 'No dashboard data is available.'}
            </div>
          )}
        </section>
        <aside className="dashboard-aside">
          <div className="aside-card career-card">
            <div className="aside-icon tint-sage">
              <Compass size={19} />
            </div>
            <span className="eyebrow">A LITTLE PROGRESS</span>
            <h3>Your detective career</h3>
            <p>
              {data?.stats?.solved
                ? `You've solved ${data.stats.solved} ${data.stats.solved === 1 ? 'case' : 'cases'} so far. Keep noticing the small details.`
                : 'Your first solved case is waiting to give your detective story a name.'}
            </p>
            <Link to="/profile" className="underlined-link">
              Visit your profile <ArrowRight size={14} />
            </Link>
          </div>
          <div className="aside-card room-card">
            <div className="aside-heading">
              <Users size={17} />
              <strong>Join a shared case</strong>
            </div>
            <p>Have a room code from another detective?</p>
            <form className="room-join-form" onSubmit={joinRoom}>
              <input
                aria-label="Room code"
                placeholder="6-letter code"
                value={roomCode}
                onChange={(e) =>
                  setRoomCode(e.target.value.toUpperCase().slice(0, 6))
                }
                maxLength={6}
              />
              <button
                aria-label="Join room"
                className="button button-soft"
                disabled={busy || roomCode.length !== 6}
              >
                <ArrowRight size={15} />
              </button>
            </form>
            {roomError && <span className="field-error">{roomError}</span>}
          </div>
        </aside>
      </div>
    </>
  )
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={22} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}

function CreateMysteryPage() {
  const navigate = useNavigate()
  const [scenario, setScenario] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [selected, setSelected] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const requestIdentity = useRef(null)
  function useIdea(idea) {
    setScenario(idea.story)
    setSelected(idea.id)
    document.getElementById('story-input')?.focus()
  }
  function surprise() {
    const choices = suggestions.filter((item) => item.id !== selected)
    useIdea(choices[Math.floor(Math.random() * choices.length)])
  }
  async function runGeneration() {
    if (inFlight.current) return
    const story = scenario.trim()
    if (story.length < 40)
      return setError(
        'Add a little more detail—at least 40 characters helps make a fair case.',
      )
    const fingerprint = `${difficulty}\u0000${story}`
    if (requestIdentity.current?.fingerprint !== fingerprint) {
      const key =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`
      requestIdentity.current = { fingerprint, key }
    }
    inFlight.current = true
    setError('')
    setBusy(true)
    try {
      const { case: item } = await api('/cases/generate', {
        method: 'POST',
        headers: { 'Idempotency-Key': requestIdentity.current.key },
        body: JSON.stringify({ scenario: story, difficulty }),
      })
      navigate(`/cases/${item.id}`)
    } catch (caught) {
      setError(caught.message)
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  function submit(event) {
    event.preventDefault()
    void runGeneration()
  }
  function retryGeneration() {
    void runGeneration()
  }
  return (
    <>
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={15} /> Your detective desk
      </Link>
      <PageTitle
        eyebrow="CREATE MYSTERY"
        title="A story starts here."
        description="Bring an idea of your own, or borrow one to get your imagination moving."
      />
      <form className="create-layout" onSubmit={submit}>
        <div className="create-main">
          <section className="paper-panel story-panel">
            <label className="large-label" htmlFor="story-input">
              Describe your mystery
            </label>
            <p>Set the scene. What happened, and what feels a little off?</p>
            <textarea
              id="story-input"
              value={scenario}
              maxLength={4000}
              onChange={(e) => {
                setScenario(e.target.value)
                setSelected('')
              }}
              placeholder="A priceless necklace disappears during a college cultural festival, and several people have different explanations."
              required
            />
            <div className="textarea-meta">
              <span>{scenario.length}/4,000 characters</span>
              <span>At least 40 characters</span>
            </div>
          </section>
          <section className="suggestions-section">
            <div className="section-title">
              <div>
                <span className="eyebrow">A STARTING POINT</span>
                <h2>Need some inspiration?</h2>
                <p>Choose an idea to use as your starting story.</p>
              </div>
              <button
                className="button button-soft"
                type="button"
                onClick={surprise}
              >
                <Sparkles size={15} /> Surprise me
              </button>
            </div>
            <div className="suggestion-grid">
              {suggestions.map((idea) => (
                <article
                  className={`suggestion-card ${selected === idea.id ? 'suggestion-selected' : ''}`}
                  key={idea.id}
                >
                  <div className={`suggestion-art ${idea.tint}`}>
                    <img src={idea.image} alt="" />
                    <span>{idea.tag}</span>
                    {selected === idea.id && (
                      <span className="selected-check">
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                  <div className="suggestion-body">
                    <h3>{idea.title}</h3>
                    <p>{idea.description}</p>
                    <button
                      type="button"
                      className="suggestion-link"
                      onClick={() => useIdea(idea)}
                    >
                      {selected === idea.id ? 'Idea selected' : 'Use this idea'}{' '}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className="create-aside">
          <section className="paper-panel difficulty-panel">
            <span className="eyebrow">CASE COMPLEXITY</span>
            <h2>Choose a difficulty</h2>
            <p>This shapes the number of people and clues in your case.</p>
            <div className="difficulty-options">
              {[
                {
                  id: 'easy',
                  name: 'Easy',
                  desc: '3 suspects · at least 5 clues',
                  tint: 'diff-sage',
                },
                {
                  id: 'medium',
                  name: 'Medium',
                  desc: '4 suspects · at least 7 clues',
                  tint: 'diff-lavender',
                },
                {
                  id: 'hard',
                  name: 'Hard',
                  desc: '5 suspects · at least 9 clues',
                  tint: 'diff-blush',
                },
              ].map((option) => (
                <label
                  key={option.id}
                  className={`difficulty-option ${difficulty === option.id ? 'difficulty-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={option.id}
                    checked={difficulty === option.id}
                    onChange={() => setDifficulty(option.id)}
                  />
                  <span className={`difficulty-dot ${option.tint}`} />
                  <span>
                    <strong>{option.name}</strong>
                    <small>{option.desc}</small>
                  </span>
                  {difficulty === option.id && <Check size={15} />}
                </label>
              ))}
            </div>
            <div className="notice notice-soft">
              <Lightbulb size={16} />
              <span>
                Your idea stays editable. Selecting a card never starts a case
                by itself.
              </span>
            </div>
            {error && (
              <div role="alert" className="notice notice-error">
                <span>{error}</span>{' '}
                <button
                  type="button"
                  className="text-action"
                  onClick={retryGeneration}
                  disabled={busy}
                >
                  Retry
                </button>
              </div>
            )}
            <button
              className="button button-primary full-button generate-button"
              type="submit"
              disabled={busy || scenario.trim().length < 40}
            >
              {busy ? (
                <>
                  <span className="spinner spinner-small" /> Building your case…
                </>
              ) : (
                <>
                  Generate mystery <ArrowRight size={16} />
                </>
              )}
            </button>
            <small className="private-note">
              Your case and its solution are saved privately.
            </small>
          </section>
          <div className="create-aside-note">
            <BookOpen size={17} />
            <span>
              Every case begins with one question:
              <br />
              <em>What else might have happened?</em>
            </span>
          </div>
        </aside>
      </form>
    </>
  )
}

function EditCasePage() {
  const { caseId } = useParams()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    api(`/cases/${caseId}`)
      .then(({ case: item }) =>
        setForm({
          title: item.title,
          originalScenario: item.originalScenario,
          difficulty: item.difficulty,
        }),
      )
      .catch((e) => setError(e.message))
  }, [caseId])
  async function save(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      const { case: item } = await api(`/cases/${caseId}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      })
      setForm({
        title: item.title,
        originalScenario: item.originalScenario,
        difficulty: item.difficulty,
      })
      setSuccess(
        'Your case changes were saved. Existing clues and investigation records were preserved.',
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  if (error && !form) return <NoticePage error={error} />
  if (!form) return <LoadingPage text="Opening the case file…" />
  return (
    <>
      <Link to={`/cases/${caseId}`} className="back-link">
        <ArrowLeft size={15} /> Back to the case
      </Link>
      <PageTitle
        eyebrow="EDIT CASE"
        title="Update your case details."
        description="Change the title, story, or difficulty. Existing clues and investigation progress stay as they are."
      />
      <form className="create-layout" onSubmit={save}>
        <div className="create-main">
          <section className="paper-panel story-panel">
            <label className="form-field">
              <span>Case title</span>
              <input
                value={form.title}
                minLength={5}
                maxLength={120}
                required
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label className="large-label" htmlFor="edit-story-input">
              Case story / premise
            </label>
            <p>Update the story recorded for this case.</p>
            <textarea
              id="edit-story-input"
              value={form.originalScenario}
              minLength={40}
              maxLength={4000}
              required
              onChange={(e) =>
                setForm({ ...form, originalScenario: e.target.value })
              }
            />
            <div className="textarea-meta">
              <span>{form.originalScenario.length}/4,000 characters</span>
              <span>At least 40 characters</span>
            </div>
          </section>
        </div>
        <aside className="create-aside">
          <section className="paper-panel difficulty-panel">
            <span className="eyebrow">CASE COMPLEXITY</span>
            <h2>Choose a difficulty</h2>
            <p>
              This changes the saved difficulty only; existing suspects and
              clues are preserved.
            </p>
            <div className="difficulty-options">
              {[
                {
                  id: 'easy',
                  name: 'Easy',
                  desc: 'A gentler case',
                  tint: 'diff-sage',
                },
                {
                  id: 'medium',
                  name: 'Medium',
                  desc: 'A balanced case',
                  tint: 'diff-lavender',
                },
                {
                  id: 'hard',
                  name: 'Hard',
                  desc: 'A more challenging case',
                  tint: 'diff-blush',
                },
              ].map((option) => (
                <label
                  key={option.id}
                  className={`difficulty-option ${form.difficulty === option.id ? 'difficulty-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="edit-difficulty"
                    value={option.id}
                    checked={form.difficulty === option.id}
                    onChange={() => setForm({ ...form, difficulty: option.id })}
                  />
                  <span className={`difficulty-dot ${option.tint}`} />
                  <span>
                    <strong>{option.name}</strong>
                    <small>{option.desc}</small>
                  </span>
                  {form.difficulty === option.id && <Check size={15} />}
                </label>
              ))}
            </div>
            {error && (
              <div role="alert" className="notice notice-error">
                {error}
              </div>
            )}
            {success && (
              <div role="status" className="notice notice-success">
                {success}
              </div>
            )}
            <button
              className="button button-primary full-button"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="spinner spinner-small" /> Saving…
                </>
              ) : (
                <>
                  Save case <Check size={16} />
                </>
              )}
            </button>
          </section>
        </aside>
      </form>
    </>
  )
}

function CaseIntroPage() {
  const { caseId } = useParams()
  const [caseData, setCaseData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    api(`/cases/${caseId}`)
      .then((d) => setCaseData(d.case))
      .catch((e) => setError(e.message))
  }, [caseId])
  async function start() {
    setBusy(true)
    try {
      const { investigation } = await api('/investigations', {
        method: 'POST',
        body: JSON.stringify({ caseId }),
      })
      navigate(`/investigations/${investigation.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  if (error) return <NoticePage error={error} />
  if (!caseData) return <LoadingPage text="Opening the case file…" />
  return (
    <>
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={15} /> Your detective desk
      </Link>
      <div className="case-intro-card">
        <div className="case-intro-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            {caseData.difficulty.toUpperCase()} CASE · READY TO OPEN
          </div>
          <h1>{caseData.title}</h1>
          <p>{caseData.summary}</p>
          <div className="case-facts">
            <span>
              <MapPin size={15} />
              {caseData.incidentDetails.location}
            </span>
            <span>
              <Users size={15} />
              {caseData.suspects.length} people to meet
            </span>
            <span>
              <FileSearch size={15} />
              {caseData.evidence.length} pieces to examine
            </span>
          </div>
          {error && <div className="notice notice-error">{error}</div>}
          <Link to={`/cases/${caseId}/edit`} className="button button-soft">
            Edit case
          </Link>{' '}
          <button
            className="button button-primary"
            onClick={start}
            disabled={busy}
          >
            {busy ? (
              <>
                <span className="spinner spinner-small" /> Opening…
              </>
            ) : (
              <>
                Start investigation <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
        <div className="case-intro-art">
          <img
            src="/images/field-notes.svg"
            alt="A detective's field notes, a magnifying glass, and a sealed envelope"
          />
          <span>
            FIELD JOURNAL · NO. {String(caseData.id).slice(-4).toUpperCase()}
          </span>
        </div>
      </div>
      <div className="case-note-strip">
        <Lightbulb size={17} />
        <p>
          The case file contains the details available to you. Follow the
          evidence and make your own connections.
        </p>
      </div>
    </>
  )
}

function LoadingPage({ text = 'Loading…' }) {
  return (
    <div className="loading-screen">
      <span className="spinner" />
      {text}
    </div>
  )
}
function NoticePage({ error }) {
  return (
    <section className="notice-page">
      <div className="eyebrow">
        <span className="eyebrow-line" />A SMALL SETBACK
      </div>
      <h1>We couldn't open that file.</h1>
      <p>{error}</p>
      <Link to="/dashboard" className="button button-primary">
        Back to your desk <ArrowRight size={15} />
      </Link>
    </section>
  )
}

const workspaceTabs = [
  ['overview', 'Overview', Compass],
  ['suspects', 'Suspects', Users],
  ['evidence', 'Evidence vault', FileSearch],
  ['interrogate', 'Conversations', AudioLines],
  ['timeline', 'Timeline', BookOpen],
  ['theories', 'Theory lab', Lightbulb],
  ['board', 'Truth graph', Fingerprint],
  ['scene', 'Crime scene', Search],
  ['analyzer', 'Evidence notes', Sparkles],
  ['verdict', 'Final verdict', Flag],
]
function WorkspacePage() {
  const { investigationId } = useParams()
  const location = useLocation()
  const [record, setRecord] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState(
    location.pathname.endsWith('/result') ? 'verdict' : 'overview',
  )
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    api(`/investigations/${investigationId}`)
      .then((d) => setRecord(d.investigation))
      .catch((e) => setError(e.message))
  }, [investigationId, refresh])
  useEffect(() => {
    if (location.pathname.endsWith('/result') || record?.status === 'completed')
      setTab('verdict')
  }, [location.pathname, record?.status])
  if (error) return <NoticePage error={error} />
  if (!record) return <LoadingPage text="Gathering your notes…" />
  return (
    <>
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={15} /> Your detective desk
      </Link>
      <div className="workspace-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            {record.case.difficulty.toUpperCase()} INVESTIGATION
          </div>
          <h1>{record.case.title}</h1>
          <p>{record.case.summary}</p>
        </div>
        <span className="workspace-status">
          <span />{' '}
          {record.status === 'completed' ? 'Verdict filed' : 'Case in progress'}
        </span>
      </div>
      <div
        className="workspace-tabs"
        role="tablist"
        aria-label="Investigation sections"
      >
        {workspaceTabs.map(([id, label, Icon]) => (
          <button
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'workspace-tab active' : 'workspace-tab'}
            key={id}
            onClick={() => setTab(id)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
      <div className="workspace-content">
        <WorkspaceSection
          key={tab}
          tab={tab}
          record={record}
          onUpdate={() => setRefresh((v) => v + 1)}
          onTab={setTab}
        />
      </div>
    </>
  )
}

function WorkspaceSection({ tab, record, onUpdate, onTab }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [question, setQuestion] = useState('')
  const [suspectId, setSuspectId] = useState(record.case.suspects[0]?.id || '')
  const [theory, setTheory] = useState({
    title: '',
    explanation: '',
    suspectIds: [],
    supportingEvidenceIds: [],
    contradictingEvidenceIds: [],
    missingInformation: '',
    notes: '',
  })
  const [timelineEvent, setTimelineEvent] = useState('')
  const [timelineTime, setTimelineTime] = useState('')
  const [graphFrom, setGraphFrom] = useState('')
  const [graphTo, setGraphTo] = useState('')
  const [draggingNode, setDraggingNode] = useState('')
  const [answer, setAnswer] = useState('')
  const [verdict, setVerdict] = useState({
    culpritId: '',
    motive: '',
    method: '',
    explanation: '',
    supportingEvidenceIds: [],
  })
  const [solution, setSolution] = useState(null)
  const [activeEvidence, setActiveEvidence] = useState(null)
  const [comparisonEvidence, setComparisonEvidence] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [hotspot, setHotspot] = useState(null)
  const [hintText, setHintText] = useState('')
  const caseData = record.case
  async function act(fn) {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await fn()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  async function requestHint() {
    await act(async () => {
      const result = await api(`/investigations/${record.id}/hint`, {
        method: 'POST',
      })
      setHintText(result.hint)
      onUpdate()
    })
  }
  async function discover(id) {
    await act(async () => {
      await api(`/investigations/${record.id}/evidence/${id}/discover`, {
        method: 'POST',
      })
      onUpdate()
      setSuccess('Added to your discovered evidence.')
    })
  }
  async function submitQuestion(event) {
    event.preventDefault()
    await act(async () => {
      const data = await api(`/investigations/${record.id}/interrogate`, {
        method: 'POST',
        body: JSON.stringify({ suspectId, question }),
      })
      setAnswer(data.answer)
      setQuestion('')
      onUpdate()
      if (window.speechSynthesis && 'SpeechSynthesisUtterance' in window) {
        const utterance = new window.SpeechSynthesisUtterance(data.answer)
        utterance.rate = 0.96
        window.speechSynthesis.speak(utterance)
      }
    })
  }
  async function addTheory(event) {
    event.preventDefault()
    await act(async () => {
      const editing = Boolean(theory.id)
      await api(
        `/investigations/${record.id}/theories${editing ? `/${theory.id}` : ''}`,
        { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(theory) },
      )
      setTheory({
        title: '',
        explanation: '',
        suspectIds: [],
        supportingEvidenceIds: [],
        contradictingEvidenceIds: [],
        missingInformation: '',
        notes: '',
      })
      onUpdate()
      setSuccess(
        editing
          ? 'Your theory has been updated.'
          : 'Your theory has been saved as a working hypothesis.',
      )
    })
  }
  function editTheory(item) {
    setTheory({
      id: item._id,
      title: item.title,
      explanation: item.explanation || '',
      suspectIds: item.suspectIds || [],
      supportingEvidenceIds: item.supportingEvidenceIds || [],
      contradictingEvidenceIds: item.contradictingEvidenceIds || [],
      missingInformation: item.missingInformation || '',
      notes: item.notes || '',
    })
    document.getElementById('theory-title')?.focus()
  }
  async function saveTimeline(event) {
    event.preventDefault()
    const items = [
      ...record.playerTimeline,
      { event: timelineEvent, time: timelineTime, evidenceIds: [] },
    ]
    await act(async () => {
      await api(`/investigations/${record.id}/timeline`, {
        method: 'PUT',
        body: JSON.stringify({ playerTimeline: items }),
      })
      setTimelineEvent('')
      setTimelineTime('')
      onUpdate()
      setSuccess('Your timeline note has been saved.')
    })
  }
  async function saveConnection(event) {
    event.preventDefault()
    const items = [
      ...record.graphConnections,
      { fromId: graphFrom, toId: graphTo, label: 'Possible connection' },
    ]
    await act(async () => {
      await api(`/investigations/${record.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ graphConnections: items }),
      })
      onUpdate()
      setSuccess('Connection added to your board.')
    })
  }
  async function submitVerdict(event) {
    event.preventDefault()
    await act(async () => {
      const data = await api(`/investigations/${record.id}/verdict`, {
        method: 'POST',
        body: JSON.stringify(verdict),
      })
      setSolution(data.solution)
      onUpdate()
    })
  }
  function speakQuestion() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError(
        'Voice input is not available in this browser. You can still type your question.',
      )
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = navigator.language || 'en-US'
    recognition.interimResults = false
    recognition.onresult = (event) =>
      setQuestion(event.results[0][0].transcript)
    recognition.onerror = () =>
      setError(
        'Microphone access was unavailable. You can still type your question.',
      )
    recognition.start()
  }
  const discovered = record.discoveredEvidenceIds || []
  const visibleEvidence = caseData.evidence.filter(
    (item) =>
      (filter === 'all' || item.type === filter) &&
      `${item.title} ${item.content} ${item.source}`
        .toLowerCase()
        .includes(searchText.toLowerCase()),
  )
  const locations = [
    ...new Set(
      [
        caseData.incidentDetails.location,
        ...caseData.evidence.map((item) => item.location),
      ].filter(Boolean),
    ),
  ]
  const graphEntities = [
    ...caseData.suspects.map((item) => ({
      id: item.id,
      label: item.name,
      kind: 'suspect',
    })),
    ...caseData.evidence.map((item) => ({
      id: item.id,
      label: item.title,
      kind: 'evidence',
    })),
    ...caseData.timeline.map((item) => ({
      id: 'event:' + item.id,
      label: item.event,
      kind: 'event',
    })),
    ...locations.map((item) => ({
      id: 'location:' + item,
      label: item,
      kind: 'location',
    })),
    ...caseData.suspects.map((item) => ({
      id: 'motive:' + item.id,
      label: 'Motive - ' + item.name,
      kind: 'motive',
    })),
  ]
  const options = graphEntities.slice(0, 28)
  const savedPositions = new Map(
    (record.graphLayout || [])
      .filter((node) => options.some((item) => item.id === node.nodeId))
      .map((node) => [node.nodeId, node.position]),
  )
  const orderedGraphEntities = [...options].sort(
    (a, b) =>
      (savedPositions.get(a.id) ?? options.indexOf(a)) -
      (savedPositions.get(b.id) ?? options.indexOf(b)),
  )
  function graphLabel(id) {
    return graphEntities.find((item) => item.id === id)?.label || id
  }
  async function moveGraphNode(targetId) {
    if (!draggingNode || draggingNode === targetId) return
    const items = [...orderedGraphEntities]
    const from = items.findIndex((item) => item.id === draggingNode)
    const to = items.findIndex((item) => item.id === targetId)
    if (from < 0 || to < 0) return
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved)
    await act(async () => {
      await api(`/investigations/${record.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          graphLayout: items.map((item, position) => ({
            nodeId: item.id,
            position,
          })),
        }),
      })
      onUpdate()
      setSuccess('Your board arrangement has been saved.')
    })
  }
  async function removeGraphConnection(index) {
    const graphConnections = record.graphConnections.filter(
      (_, itemIndex) => itemIndex !== index,
    )
    await act(async () => {
      await api(`/investigations/${record.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ graphConnections }),
      })
      onUpdate()
      setSuccess('Connection removed from your board.')
    })
  }
  let content
  if (tab === 'overview')
    content = (
      <>
        <div className="section-title">
          <div>
            <span className="eyebrow">CASE OVERVIEW</span>
            <h2>Start with what you know</h2>
          </div>
          <span className="soft-badge">
            {caseData.evidence.length} evidence items
          </span>
        </div>
        <p className="workspace-lede">{caseData.summary}</p>
        <div className="overview-grid">
          <div className="overview-card blush-panel">
            <span className="eyebrow">THE INCIDENT</span>
            <h3>{caseData.incidentDetails.type}</h3>
            <p>
              {caseData.incidentDetails.location} ·{' '}
              {caseData.incidentDetails.incidentTime}
            </p>
          </div>
          <div className="overview-card sage-panel">
            <span className="eyebrow">PEOPLE TO MEET</span>
            <strong>{caseData.suspects.length}</strong>
            <p>Each person has their own account of what happened.</p>
          </div>
          <div className="overview-card lavender-panel">
            <span className="eyebrow">DISCOVERED SO FAR</span>
            <strong>
              {discovered.length}
              <small> / {caseData.evidence.length}</small>
            </strong>
            <p>Evidence you choose to examine stays in your case notes.</p>
          </div>
        </div>
        <div className="next-clue-panel">
          <Sparkles size={18} />
          <div>
            <strong>Where would you like to look first?</strong>
            <p>
              Meet the people involved, examine the evidence, or place a few
              events on your timeline.
            </p>
          </div>
          <button
            className="button button-soft"
            onClick={() => onTab('evidence')}
          >
            Open evidence vault <ArrowRight size={14} />
          </button>
        </div>
        {!record.verdict && (
          <div className="hint-panel">
            <div>
              <span className="eyebrow">A SMALL NUDGE</span>
              <p>
                {hintText ||
                  record.hintHistory?.at(-1)?.text ||
                  `${record.hintsUsed} hint${record.hintsUsed === 1 ? '' : 's'} used · hints lower the final score by 10 points each.`}
              </p>
            </div>
            <button
              className="button button-soft"
              onClick={requestHint}
              disabled={busy}
            >
              Ask for a hint <Lightbulb size={14} />
            </button>
          </div>
        )}
      </>
    )
  else if (tab === 'suspects')
    content = (
      <>
        <div className="section-title">
          <div>
            <span className="eyebrow">PEOPLE CONNECTED TO THE CASE</span>
            <h2>Meet the suspects</h2>
          </div>
        </div>
        <div className="suspect-grid">
          {caseData.suspects.map((suspect, i) => (
            <article className="suspect-card" key={suspect.id}>
              <div className={`suspect-avatar suspect-tint-${i % 4}`}>
                {suspect.name
                  .split(' ')
                  .map((s) => s[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <span className="difficulty-label">
                PERSON {String(i + 1).padStart(2, '0')}
              </span>
              <h3>{suspect.name}</h3>
              <p className="suspect-role">{suspect.role}</p>
              <div className="suspect-detail">
                <strong>Known for</strong>
                <p>{suspect.personality}</p>
              </div>
              <div className="suspect-detail">
                <strong>Their account</strong>
                <p>{suspect.alibi}</p>
              </div>
              <div className="suspect-motive">
                <span>Possible motive</span>
                <p>{suspect.motive}</p>
              </div>
              {suspect.relationships?.length > 0 && (
                <div className="suspect-detail">
                  <strong>Connections</strong>
                  <p>{suspect.relationships.join(' ? ')}</p>
                </div>
              )}
              <div className="suspect-detail">
                <strong>What they know</strong>
                <p>{suspect.knownInformation.join(' ')}</p>
              </div>
              <button
                className="button button-soft"
                onClick={() => {
                  setSuspectId(suspect.id)
                  onTab('interrogate')
                }}
              >
                Ask a question <AudioLines size={14} />
              </button>
            </article>
          ))}
        </div>
      </>
    )
  else if (tab === 'evidence')
    content = (
      <>
        <div className="section-title">
          <div>
            <span className="eyebrow">THE EVIDENCE VAULT</span>
            <h2>Examine the details</h2>
            <p>Claims and confirmed records are labelled separately.</p>
          </div>
          <span className="soft-badge">{discovered.length} discovered</span>
        </div>
        <div className="evidence-tools">
          <label className="search-box">
            <Search size={16} />
            <input
              aria-label="Search evidence"
              placeholder="Search the case file"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </label>
          <label className="select-wrap">
            <span className="sr-only">Filter evidence by type</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All types</option>
              {[...new Set(caseData.evidence.map((item) => item.type))].map(
                (type) => (
                  <option key={type} value={type}>
                    {type.replace('-', ' ')}
                  </option>
                ),
              )}
            </select>
            <ChevronDown size={14} />
          </label>
        </div>
        <div className="evidence-grid">
          {visibleEvidence.map((item) => (
            <article className="evidence-card" key={item.id}>
              <div className="evidence-top">
                <span className="evidence-type">
                  {item.type.replace('-', ' ')}
                </span>
                <Reliability label={item.reliability.label} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
              <div className="evidence-meta">
                <span>{item.source}</span>
                <span>{item.timestamp || 'No timestamp'}</span>
              </div>
              <div className="evidence-card-actions">
                <button
                  className="text-action"
                  onClick={() => setActiveEvidence(item)}
                >
                  Evidence notes <ArrowRight size={13} />
                </button>
                {discovered.includes(item.id) ? (
                  <span className="discovered-label">
                    <Check size={14} /> Discovered
                  </span>
                ) : (
                  <button
                    className="button button-soft"
                    onClick={() => discover(item.id)}
                    disabled={busy}
                  >
                    Examine
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        {visibleEvidence.length === 0 && (
          <EmptyState
            icon={Search}
            title="No matching evidence"
            text="Try another search term or evidence type."
          />
        )}
        {activeEvidence && (
          <EvidenceModal
            item={activeEvidence}
            close={() => setActiveEvidence(null)}
          />
        )}
      </>
    )
  else if (tab === 'interrogate')
    content = (
      <>
        <div className="section-title">
          <div>
            <span className="eyebrow">SUSPECT INTERROGATION</span>
            <h2>Ask, listen, and compare</h2>
            <p>
              Answers follow each person's known information and the evidence
              you've discovered.
            </p>
          </div>
          <span className="soft-badge">
            <AudioLines size={14} /> Text and voice
          </span>
        </div>
        <div className="interview-layout">
          <div className="interview-suspects">
            <span className="eyebrow">CHOOSE A PERSON</span>
            {caseData.suspects.map((suspect) => (
              <button
                key={suspect.id}
                className={
                  suspectId === suspect.id
                    ? 'interview-person selected'
                    : 'interview-person'
                }
                onClick={() => setSuspectId(suspect.id)}
              >
                <span className="tiny-avatar">{suspect.name[0]}</span>
                <span>
                  {suspect.name}
                  <small>{suspect.role}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="interview-room">
            <div className="interview-room-header">
              <div className="tiny-avatar">
                {caseData.suspects.find((s) => s.id === suspectId)?.name?.[0] ||
                  '?'}
              </div>
              <div>
                <strong>
                  {caseData.suspects.find((s) => s.id === suspectId)?.name}
                </strong>
                <small>Conversation · saved to this investigation</small>
              </div>
            </div>
            <div className="conversation-list">
              {record.interrogationHistory
                .filter((entry) => entry.suspectId === suspectId)
                .map((entry, index) => (
                  <div className="conversation-pair" key={index}>
                    <div className="chat-question">{entry.question}</div>
                    <div className="chat-answer">{entry.answer}</div>
                  </div>
                ))}
              {answer && (
                <div className="chat-answer latest-answer">{answer}</div>
              )}
              {record.interrogationHistory.filter(
                (entry) => entry.suspectId === suspectId,
              ).length === 0 &&
                !answer && (
                  <div className="conversation-empty">
                    <AudioLines size={21} />
                    <p>
                      Ask an open question about their account, the people
                      involved, or a detail you've found.
                    </p>
                  </div>
                )}
            </div>
            <form className="question-form" onSubmit={submitQuestion}>
              <textarea
                aria-label="Your question"
                placeholder="What did you notice around the time of the incident?"
                value={question}
                maxLength={1000}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
              <button
                type="button"
                className="icon-button mic-button"
                onClick={speakQuestion}
                title="Ask using your voice"
                aria-label="Use voice input"
              >
                <Mic size={17} />
              </button>
              <button
                className="button button-primary"
                disabled={busy || question.trim().length < 2}
              >
                {busy ? (
                  <span className="spinner spinner-small" />
                ) : (
                  <>
                    Ask <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
            {error && <div className="notice notice-error">{error}</div>}
          </div>
        </div>
      </>
    )
  else if (tab === 'timeline')
    content = (
      <>
        <div className="section-title">
          <div>
            <span className="eyebrow">RECONSTRUCT THE NIGHT</span>
            <h2>Build your timeline</h2>
            <p>
              Case events are shown with their certainty. Your notes are marked
              as hypotheses.
            </p>
          </div>
        </div>
        <div className="timeline-columns">
          <div>
            <h3 className="minor-heading">CASE RECORD</h3>
            <div className="timeline-list">
              {caseData.timeline.map((item) => (
                <div className="timeline-event" key={item.id}>
                  <span
                    className={`timeline-dot certainty-${item.certainty}`}
                  />
                  <time>{item.time}</time>
                  <div>
                    <strong>{item.event}</strong>
                    <span
                      className={`certainty-label certainty-text-${item.certainty}`}
                    >
                      {item.certainty}
                    </span>
                    {item.evidenceIds.length > 0 && (
                      <p>
                        {item.evidenceIds
                          .map(
                            (id) =>
                              caseData.evidence.find((e) => e.id === id)?.title,
                          )
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="minor-heading">YOUR WORKING NOTES</h3>
            <form className="mini-form" onSubmit={saveTimeline}>
              <Field label="When?" id="timeline-time">
                <input
                  id="timeline-time"
                  placeholder="Around 8:15 pm"
                  value={timelineTime}
                  onChange={(e) => setTimelineTime(e.target.value)}
                  required
                />
              </Field>
              <Field label="What might have happened?" id="timeline-event">
                <textarea
                  id="timeline-event"
                  placeholder="Write a timeline note…"
                  value={timelineEvent}
                  onChange={(e) => setTimelineEvent(e.target.value)}
                  required
                />
              </Field>
              <button className="button button-soft" disabled={busy}>
                <Plus size={14} /> Add to my timeline
              </button>
            </form>
            {record.playerTimeline.map((entry, index) => (
              <article className="player-timeline-note" key={index}>
                <span>YOUR HYPOTHESIS</span>
                <strong>{entry.time}</strong>
                <p>{entry.event}</p>
              </article>
            ))}
          </div>
        </div>
      </>
    )
  else if (tab === 'theories')
    content = (
      <>
        <div className="section-title">
          <div>
            <span className="eyebrow">DETECTIVE'S THEORY LAB</span>
            <h2>Try an explanation</h2>
            <p>
              Theories stay yours. The case won't tell you if one is right
              before your verdict.
            </p>
          </div>
        </div>
        <div className="theory-layout">
          <form className="paper-panel theory-form" onSubmit={addTheory}>
            <h3>
              {theory.id ? 'Update working theory' : 'New working theory'}
            </h3>
            <Field label="Give it a name" id="theory-title">
              <input
                id="theory-title"
                value={theory.title}
                onChange={(e) =>
                  setTheory({ ...theory, title: e.target.value })
                }
                placeholder="A theory about the missing hour"
                required
              />
            </Field>
            <Field label="Your explanation" id="theory-exp">
              <textarea
                id="theory-exp"
                value={theory.explanation}
                onChange={(e) =>
                  setTheory({ ...theory, explanation: e.target.value })
                }
                placeholder="What might connect the details?"
              />
            </Field>
            <fieldset className="theory-reference-group">
              <legend>People in this theory</legend>
              {caseData.suspects.map((person) => (
                <label key={person.id}>
                  <input
                    type="checkbox"
                    checked={theory.suspectIds.includes(person.id)}
                    onChange={(e) =>
                      setTheory({
                        ...theory,
                        suspectIds: e.target.checked
                          ? [...theory.suspectIds, person.id]
                          : theory.suspectIds.filter((id) => id !== person.id),
                      })
                    }
                  />
                  <span>{person.name}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className="theory-reference-group">
              <legend>Evidence supporting this idea</legend>
              {caseData.evidence
                .filter((item) => discovered.includes(item.id))
                .map((item) => (
                  <label key={item.id}>
                    <input
                      type="checkbox"
                      checked={theory.supportingEvidenceIds.includes(item.id)}
                      onChange={(e) =>
                        setTheory({
                          ...theory,
                          supportingEvidenceIds: e.target.checked
                            ? [...theory.supportingEvidenceIds, item.id]
                            : theory.supportingEvidenceIds.filter(
                                (id) => id !== item.id,
                              ),
                        })
                      }
                    />
                    <span>{item.title}</span>
                  </label>
                ))}
              {discovered.length === 0 && (
                <p>Examine evidence to link it to this theory.</p>
              )}
            </fieldset>
            <fieldset className="theory-reference-group">
              <legend>Evidence that may challenge it</legend>
              {caseData.evidence
                .filter((item) => discovered.includes(item.id))
                .map((item) => (
                  <label key={item.id}>
                    <input
                      type="checkbox"
                      checked={theory.contradictingEvidenceIds.includes(
                        item.id,
                      )}
                      onChange={(e) =>
                        setTheory({
                          ...theory,
                          contradictingEvidenceIds: e.target.checked
                            ? [...theory.contradictingEvidenceIds, item.id]
                            : theory.contradictingEvidenceIds.filter(
                                (id) => id !== item.id,
                              ),
                        })
                      }
                    />
                    <span>{item.title}</span>
                  </label>
                ))}
            </fieldset>
            <Field label="Information still missing" id="theory-missing">
              <textarea
                id="theory-missing"
                value={theory.missingInformation}
                onChange={(e) =>
                  setTheory({ ...theory, missingInformation: e.target.value })
                }
                placeholder="What would help test this explanation?"
              />
            </Field>
            <Field label="Notes and questions" id="theory-notes">
              <textarea
                id="theory-notes"
                value={theory.notes}
                onChange={(e) =>
                  setTheory({ ...theory, notes: e.target.value })
                }
                placeholder="What would you still like to find out?"
              />
            </Field>
            <button className="button button-primary" disabled={busy}>
              <Plus size={14} /> {theory.id ? 'Update theory' : 'Save theory'}
            </button>
          </form>
          <div className="theory-list">
            {record.theories.length ? (
              record.theories.map((item) => (
                <article className="theory-card" key={item._id}>
                  <span className="hypothesis-label">PLAYER HYPOTHESIS</span>
                  <h3>{item.title}</h3>
                  <p>{item.explanation || 'No explanation added yet.'}</p>
                  {item.suspectIds?.length > 0 && (
                    <p className="theory-reference-copy">
                      <strong>People considered</strong>{' '}
                      {item.suspectIds
                        .map(
                          (id) =>
                            caseData.suspects.find((person) => person.id === id)
                              ?.name,
                        )
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {item.supportingEvidenceIds?.length > 0 && (
                    <p className="theory-reference-copy">
                      <strong>Supporting clues</strong>{' '}
                      {item.supportingEvidenceIds
                        .map(
                          (id) =>
                            caseData.evidence.find((entry) => entry.id === id)
                              ?.title,
                        )
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {item.contradictingEvidenceIds?.length > 0 && (
                    <p className="theory-reference-copy">
                      <strong>Possible challenges</strong>{' '}
                      {item.contradictingEvidenceIds
                        .map(
                          (id) =>
                            caseData.evidence.find((entry) => entry.id === id)
                              ?.title,
                        )
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {item.missingInformation && (
                    <p className="theory-reference-copy">
                      <strong>Still missing</strong> {item.missingInformation}
                    </p>
                  )}
                  {item.notes && <blockquote>{item.notes}</blockquote>}
                  <div className="theory-actions">
                    <button
                      type="button"
                      className="text-action"
                      onClick={() => editTheory(item)}
                    >
                      Edit theory
                    </button>
                    <button
                      type="button"
                      className="text-action"
                      onClick={() =>
                        act(async () => {
                          await api(
                            `/investigations/${record.id}/theories/${item._id}`,
                            { method: 'DELETE' },
                          )
                          onUpdate()
                        })
                      }
                    >
                      Remove theory <X size={13} />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                icon={Lightbulb}
                title="Your theory space is open"
                text="Add an explanation to keep track of the details you want to connect."
              />
            )}
          </div>
        </div>
      </>
    )
  else if (tab === 'board')
    content = (
      <>
        <div className="section-title">
          <div>
            <span className="eyebrow">
              TRUTH GRAPH · YOUR INVESTIGATION BOARD
            </span>
            <h2>Connect the pieces</h2>
            <p>
              Every line here is a player-created possibility, not a verified
              fact.
            </p>
          </div>
        </div>
        <div className="graph-canvas">
          <div className="graph-node-grid">
            {orderedGraphEntities.slice(0, 28).map((item) => (
              <span
                draggable
                onDragStart={() => setDraggingNode(item.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => moveGraphNode(item.id)}
                onDragEnd={() => setDraggingNode('')}
                title="Drag to arrange"
                className={`graph-node ${item.kind === 'suspect' ? 'graph-suspect' : item.kind === 'evidence' ? (discovered.includes(item.id) ? 'graph-discovered' : 'graph-locked') : `graph-${item.kind}`}`}
                key={`${item.kind}-${item.id}`}
              >
                {item.kind === 'suspect' ? (
                  <Users size={14} />
                ) : item.kind === 'evidence' ? (
                  <FileSearch size={14} />
                ) : item.kind === 'event' ? (
                  <BookOpen size={14} />
                ) : item.kind === 'location' ? (
                  <MapPin size={14} />
                ) : (
                  <Lightbulb size={14} />
                )}
                {item.label}
                {item.kind === 'evidence' && !discovered.includes(item.id) && (
                  <small>Not examined</small>
                )}
              </span>
            ))}
          </div>
          <svg className="graph-lines" aria-hidden="true">
            {record.graphConnections.map((link, index) => (
              <line
                key={index}
                x1="22%"
                y1={`${18 + index * 12}%`}
                x2="78%"
                y2={`${24 + index * 12}%`}
              />
            ))}
          </svg>
        </div>
        <form className="graph-controls" onSubmit={saveConnection}>
          <label>
            <span>Connect</span>
            <select
              value={graphFrom}
              onChange={(e) => setGraphFrom(e.target.value)}
              required
            >
              <option value="">Choose an item</option>
              {options.map((o) => (
                <option key={`${o.kind}-${o.id}`} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <ArrowRight size={15} />
          <label>
            <span>With</span>
            <select
              value={graphTo}
              onChange={(e) => setGraphTo(e.target.value)}
              required
            >
              <option value="">Choose an item</option>
              {options
                .filter((o) => o.id !== graphFrom)
                .map((o) => (
                  <option key={`${o.kind}-${o.id}`} value={o.id}>
                    {o.label}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="button button-soft"
            disabled={busy || !graphFrom || !graphTo}
          >
            <Plus size={14} /> Connect
          </button>
        </form>
        {record.graphConnections.length > 0 && (
          <div className="graph-connection-list">
            {record.graphConnections.map((link, index) => (
              <div className="graph-connection" key={index}>
                <span>{graphLabel(link.fromId)}</span>
                <ArrowRight size={13} />
                <span>{graphLabel(link.toId)}</span>
                <button
                  type="button"
                  className="text-action"
                  onClick={() => removeGraphConnection(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        {record.graphConnections.length > 0 && (
          <p className="graph-caption">
            {record.graphConnections.length} possible connection
            {record.graphConnections.length === 1 ? '' : 's'} saved to your
            case.
          </p>
        )}
      </>
    )
  else if (tab === 'scene')
    content = (
      <>
        <div className="section-title">
          <div>
            <span className="eyebrow">INTERACTIVE CRIME SCENE</span>
            <h2>Look around the scene</h2>
            <p>
              {caseData.crimeScene?.description ||
                'Select an object to examine its case note.'}
            </p>
          </div>
        </div>
        <div className="scene-layout">
          <div className="scene-board">
            <img
              src="/images/scene.svg"
              alt="Illustrated room layout with clickable investigation areas"
            />
            {(caseData.crimeScene?.hotspots || []).map((spot, index) => (
              <button
                className={`scene-hotspot hotspot-${index % 6}`}
                key={spot.id}
                aria-label={`Inspect ${spot.label}`}
                onClick={() => setHotspot(spot)}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
          <div className="scene-hotspot-list">
            {(caseData.crimeScene?.hotspots || []).map((spot, index) => (
              <button
                className="scene-spot-row"
                key={spot.id}
                onClick={() => setHotspot(spot)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{spot.label}</strong>
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        </div>
        {hotspot && (
          <div className="scene-detail">
            <button
              className="icon-button"
              aria-label="Close scene details"
              onClick={() => setHotspot(null)}
            >
              <X size={16} />
            </button>
            <span className="eyebrow">SCENE NOTE</span>
            <h3>{hotspot.label}</h3>
            <p>{hotspot.description}</p>
            {hotspot.evidenceId && (
              <button
                className="button button-soft"
                onClick={() => discover(hotspot.evidenceId)}
                disabled={discovered.includes(hotspot.evidenceId) || busy}
              >
                {discovered.includes(hotspot.evidenceId)
                  ? 'Already in your evidence'
                  : 'Add linked evidence'}
              </button>
            )}
          </div>
        )}
      </>
    )
  else if (tab === 'analyzer')
    content = (
      <>
        <div className="section-title">
          <div>
            <span className="eyebrow">
              EVIDENCE CONFIDENCE & CONTRADICTIONS
            </span>
            <h2>Weigh what you have</h2>
            <p>
              Confidence describes the source and its limits—not a probability
              that an account is true.
            </p>
          </div>
        </div>
        <div className="analyzer-intro">
          <Sparkles size={17} />
          <p>
            These are case-provided reliability notes. Compare statements with
            records and timeline events yourself; they do not identify a
            culprit.
          </p>
        </div>
        <div className="analysis-grid">
          {caseData.evidence.map((item) => (
            <article className="analysis-card" key={item.id}>
              <div className="evidence-top">
                <span className="evidence-type">
                  {item.type.replace('-', ' ')}
                </span>
                <Reliability label={item.reliability.label} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.reliability.reason}</p>
              <div className="analysis-compare">
                <span>Related to</span>
                <strong>
                  {item.relatedSuspectIds
                    .map(
                      (id) => caseData.suspects.find((s) => s.id === id)?.name,
                    )
                    .filter(Boolean)
                    .join(', ') || 'No specific person'}
                </strong>
                <button
                  className="text-action"
                  id={`compare-evidence-${item.id}`}
                  aria-expanded={comparisonEvidence?.id === item.id}
                  aria-controls="evidence-comparison"
                  onClick={() =>
                    setComparisonEvidence(
                      comparisonEvidence?.id === item.id ? null : item,
                    )
                  }
                >
                  Compare evidence <ArrowRight size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>
        {comparisonEvidence && (
          <EvidenceComparison
            key={comparisonEvidence.id}
            item={comparisonEvidence}
            evidence={caseData.evidence}
            timeline={caseData.timeline}
            suspects={caseData.suspects}
            close={() => setComparisonEvidence(null)}
          />
        )}
      </>
    )
  else if (tab === 'verdict')
    content =
      solution || record.status === 'completed' ? (
        <VerdictResult
          solution={solution}
          record={record}
          caseData={caseData}
          investigationId={record.id}
        />
      ) : (
        <>
          <div className="section-title">
            <div>
              <span className="eyebrow">THE FINAL ACCUSATION</span>
              <h2>Make your case</h2>
              <p>
                Choose who you think is responsible and the clues that support
                your reasoning.
              </p>
            </div>
          </div>
          <div className="verdict-layout">
            <form className="paper-panel verdict-form" onSubmit={submitVerdict}>
              <Field label="Who do you accuse?" id="culprit">
                <select
                  id="culprit"
                  value={verdict.culpritId}
                  onChange={(e) =>
                    setVerdict({ ...verdict, culpritId: e.target.value })
                  }
                  required
                >
                  <option value="">Select a person</option>
                  {caseData.suspects.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Your motive theory" id="motive">
                <textarea
                  id="motive"
                  value={verdict.motive}
                  onChange={(e) =>
                    setVerdict({ ...verdict, motive: e.target.value })
                  }
                  placeholder="What might they have wanted?"
                />
              </Field>
              <Field label="Your method theory" id="method">
                <textarea
                  id="method"
                  value={verdict.method}
                  onChange={(e) =>
                    setVerdict({ ...verdict, method: e.target.value })
                  }
                  placeholder="How might it have happened?"
                />
              </Field>
              <Field label="Explain your reasoning" id="reasoning">
                <textarea
                  id="reasoning"
                  value={verdict.explanation}
                  onChange={(e) =>
                    setVerdict({ ...verdict, explanation: e.target.value })
                  }
                  placeholder="How do the details fit together?"
                />
              </Field>
              <fieldset className="supporting-evidence">
                <legend>Supporting evidence you've examined</legend>
                {caseData.evidence
                  .filter((item) => discovered.includes(item.id))
                  .map((item) => (
                    <label key={item.id}>
                      <input
                        type="checkbox"
                        checked={verdict.supportingEvidenceIds.includes(
                          item.id,
                        )}
                        onChange={(e) =>
                          setVerdict({
                            ...verdict,
                            supportingEvidenceIds: e.target.checked
                              ? [...verdict.supportingEvidenceIds, item.id]
                              : verdict.supportingEvidenceIds.filter(
                                  (id) => id !== item.id,
                                ),
                          })
                        }
                      />
                      <span>{item.title}</span>
                    </label>
                  ))}
                {discovered.length === 0 && (
                  <p>Examine some evidence first; it will appear here.</p>
                )}
              </fieldset>
              {error && (
                <div role="alert" className="notice notice-error">
                  {error}
                </div>
              )}
              <div className="notice notice-soft">
                <Flag size={15} />
                <span>
                  Your score is calculated on the server. The solution stays
                  sealed until this accusation is submitted.
                </span>
              </div>
              <button
                className="button button-primary"
                disabled={busy || !verdict.culpritId}
              >
                {busy ? (
                  <>
                    <span className="spinner spinner-small" /> Reviewing your
                    case…
                  </>
                ) : (
                  <>
                    Submit final accusation <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
            <aside className="verdict-aside">
              <div className="aside-icon tint-butter">
                <Lightbulb size={19} />
              </div>
              <h3>Before you decide</h3>
              <p>
                Consider the timeline, compare each account, and select only the
                evidence that helped you reach your conclusion.
              </p>
              <span className="soft-badge">
                {discovered.length} clues examined
              </span>
            </aside>
          </div>
        </>
      )
  else
    content = (
      <EmptyState
        icon={Compass}
        title="Choose an investigation section"
        text="Your notes and progress stay with this case as you move around."
      />
    )
  return (
    <section className="workspace-section">
      {content}
      {error && tab !== 'interrogate' && (
        <div role="alert" className="notice notice-error workspace-feedback">
          {error}
        </div>
      )}
      {success && (
        <div className="notice notice-success workspace-feedback">
          <Check size={15} />
          {success}
        </div>
      )}
    </section>
  )
}

function Reliability({ label }) {
  const title =
    {
      high: 'High confidence',
      medium: 'Medium confidence',
      low: 'Low confidence',
      unverified: 'Unverified',
    }[label] || 'Unverified'
  return <span className={`reliability reliability-${label}`}>{title}</span>
}
function EvidenceModal({ item, close }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={close}>
      <section
        className="evidence-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${item.title} evidence notes`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="icon-button modal-close"
          onClick={close}
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <span className="eyebrow">
          EVIDENCE NOTES · {item.type.toUpperCase()}
        </span>
        <h2>{item.title}</h2>
        <p>{item.content}</p>
        <Reliability label={item.reliability.label} />
        <div className="modal-note">
          <strong>Why this label?</strong>
          <p>{item.reliability.reason}</p>
        </div>
        <div className="evidence-meta">
          <span>{item.source}</span>
          <span>{item.timestamp || 'No timestamp'}</span>
        </div>
      </section>
    </div>
  )
}
function getEvidenceConnections(item, evidence, timeline, suspects) {
  const people = new Map(
    (item.relatedSuspectIds || []).map((id) => [
      id,
      suspects.find((person) => person.id === id)?.name || id,
    ]),
  )
  const ownEventIds = new Set(
    [
      item.eventId,
      ...timeline
        .filter((event) => event.evidenceIds?.includes(item.id))
        .map((event) => event.id),
    ].filter(Boolean),
  )
  const related = evidence
    .filter((entry) => entry.id !== item.id)
    .map((entry) => {
      const sharedPeople = (entry.relatedSuspectIds || []).filter((id) =>
        people.has(id),
      )
      const eventIds = new Set(
        [
          entry.eventId,
          ...timeline
            .filter((event) => event.evidenceIds?.includes(entry.id))
            .map((event) => event.id),
        ].filter(Boolean),
      )
      const sharedEvents = [...ownEventIds].filter((id) => eventIds.has(id))
      return {
        item: entry,
        sharedPeople: sharedPeople.map((id) => people.get(id)),
        sharedEvents,
      }
    })
    .filter(
      (connection) =>
        connection.sharedPeople.length || connection.sharedEvents.length,
    )
  return { people: [...people.values()], eventIds: ownEventIds, related }
}
function parseTimelineSortTime(value) {
  const match = String(value || '').match(
    /(?:^|\b)(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
  )
  if (!match) return Number.POSITIVE_INFINITY
  let hours = Number(match[1])
  const minutes = Number(match[2] || 0)
  const meridiem = match[3]?.toLowerCase()
  if (minutes > 59) return Number.POSITIVE_INFINITY
  if (meridiem) {
    if (hours < 1 || hours > 12) return Number.POSITIVE_INFINITY
    hours %= 12
    if (meridiem === 'pm') hours += 12
  } else if (hours > 23) return Number.POSITIVE_INFINITY
  return hours * 60 + minutes
}
function EvidenceComparison({ item, evidence, timeline, suspects, close }) {
  const connections = getEvidenceConnections(item, evidence, timeline, suspects)
  const defaultComparison =
    connections.related[0]?.item?.id ||
    evidence.find((entry) => entry.id !== item.id)?.id ||
    ''
  const [comparisonId, setComparisonId] = useState(defaultComparison)
  const drawerRef = useRef(null)
  const comparisonItem = evidence.find(
    (entry) => entry.id === comparisonId && entry.id !== item.id,
  )
  const comparedIds = new Set([item.id, comparisonItem?.id].filter(Boolean))
  const relevantEventIds = new Set(connections.eventIds)
  connections.related.forEach(({ item: entry }) => {
    if (entry.eventId) relevantEventIds.add(entry.eventId)
    timeline
      .filter((event) => event.evidenceIds?.includes(entry.id))
      .forEach((event) => relevantEventIds.add(event.id))
  })
  if (comparisonItem) {
    if (comparisonItem.eventId) relevantEventIds.add(comparisonItem.eventId)
    timeline
      .filter((event) => event.evidenceIds?.includes(comparisonItem.id))
      .forEach((event) => relevantEventIds.add(event.id))
  }
  const relevantEvents = timeline
    .filter(
      (entry) =>
        relevantEventIds.has(entry.id) ||
        entry.evidenceIds?.some((id) => comparedIds.has(id)),
    )
    .map((entry, index) => ({
      entry,
      index,
      sortTime: parseTimelineSortTime(entry.time),
    }))
    .sort((a, b) => a.sortTime - b.sortTime || a.index - b.index)
    .map(({ entry }) => entry)
  const timelinePeople = [
    ...new Set(
      relevantEvents
        .flatMap((event) => event.suspectIds || [])
        .map((id) => suspects.find((person) => person.id === id)?.name)
        .filter(Boolean),
    ),
  ]
  const explicitNotes = [
    item,
    ...(comparisonItem ? [comparisonItem] : []),
    ...connections.related.map((link) => link.item),
  ].filter(
    (entry, index, array) =>
      array.findIndex((candidate) => candidate.id === entry.id) === index &&
      /contradict/i.test(entry.reliability?.reason || ''),
  )
  const previousFocus =
    typeof document !== 'undefined' ? document.activeElement : null

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawerRef.current?.focus({ preventScroll: true })
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close()
        return
      }
      if (event.key !== 'Tab' || !drawerRef.current) return
      const focusable = [
        ...drawerRef.current.querySelectorAll(
          'button:not(:disabled), summary, select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ]
      if (!focusable.length) {
        event.preventDefault()
        drawerRef.current.focus()
        return
      }
      const first = focusable[0],
        last = focusable.at(-1)
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === drawerRef.current)
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === drawerRef.current)
      ) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      const trigger = document.getElementById(`compare-evidence-${item.id}`)
      ;(trigger || previousFocus)?.focus?.({ preventScroll: true })
    }
  }, [close, item.id])

  function handleBackdrop(event) {
    if (event.target === event.currentTarget) close()
  }
  const relatedSummary = connections.people.length
    ? `Related people explicitly listed on this evidence: ${connections.people.join(', ')}`
    : 'No related people are explicitly listed on this evidence.'

  return (
    <div className="comparison-backdrop" onMouseDown={handleBackdrop}>
      <section
        className="evidence-comparison-drawer"
        id="evidence-comparison"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparison-title"
        aria-describedby="comparison-description"
        tabIndex={-1}
        ref={drawerRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="comparison-drawer-header">
          <div>
            <span className="eyebrow comparison-drawer-kicker">
              CASE REVIEW
            </span>
            <h2 id="comparison-title">Evidence comparison</h2>
            <p id="comparison-description">
              Review the records and case links without leaving the analyzer.
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={close}
            aria-label="Close evidence comparison"
          >
            <X size={18} />
          </button>
        </header>
        <div className="comparison-drawer-content">
          <section
            className="drawer-evidence-section"
            aria-label="Evidence records"
          >
            <div className="comparison-pair">
              <div className="comparison-record-column">
                <span className="comparison-label">SELECTED EVIDENCE</span>
                <EvidenceComparisonCard item={item} selected />
              </div>
              <div className="comparison-record-column">
                <div className="comparison-picker">
                  <label htmlFor="comparison-evidence-select">
                    COMPARISON EVIDENCE
                  </label>
                  <select
                    id="comparison-evidence-select"
                    value={comparisonId}
                    onChange={(event) => setComparisonId(event.target.value)}
                  >
                    <option value="" disabled>
                      Select another evidence item
                    </option>
                    {evidence
                      .filter((entry) => entry.id !== item.id)
                      .map((entry) => (
                        <option value={entry.id} key={entry.id}>
                          {entry.title}
                        </option>
                      ))}
                  </select>
                </div>
                {comparisonItem ? (
                  <EvidenceComparisonCard item={comparisonItem} />
                ) : (
                  <p className="comparison-empty">
                    Choose another item to compare its case record.
                  </p>
                )}
              </div>
            </div>
          </section>
          <details className="drawer-section" open>
            <summary>Relevant timeline</summary>
            <div className="drawer-section-content">
              {relevantEvents.length ? (
                relevantEvents.map((entry) => (
                  <article className="comparison-timeline-row" key={entry.id}>
                    <time>{entry.time}</time>
                    <div>
                      <p>{entry.event}</p>
                      <span
                        className={`certainty-label certainty-text-${entry.certainty}`}
                      >
                        {entry.certainty}
                      </span>
                      <small>
                        {(entry.evidenceIds || [])
                          .map(
                            (id) =>
                              evidence.find((candidate) => candidate.id === id)
                                ?.title,
                          )
                          .filter(Boolean)
                          .join(' · ') || 'No evidence links recorded'}
                      </small>
                    </div>
                  </article>
                ))
              ) : (
                <p className="comparison-empty">
                  No timeline entry links the selected or comparison evidence.
                </p>
              )}
              {timelinePeople.length > 0 && (
                <p className="comparison-muted">
                  People listed on these timeline events:{' '}
                  {timelinePeople.join(', ')}. Event participation is a case
                  link, not an accusation.
                </p>
              )}
            </div>
          </details>
          <details className="drawer-section">
            <summary>Related people and evidence</summary>
            <div className="drawer-section-content">
              <p className="comparison-muted">
                {relatedSummary}
                {connections.people.length
                  ? ' This association does not imply responsibility.'
                  : ''}
              </p>
              {connections.related.length ? (
                <div className="connection-list">
                  {connections.related.map(
                    ({ item: entry, sharedPeople, sharedEvents }) => (
                      <article className="connection-row" key={entry.id}>
                        <strong>{entry.title}</strong>
                        <span>
                          {[
                            sharedPeople.length
                              ? `Shared person: ${sharedPeople.join(', ')}`
                              : null,
                            ...sharedEvents.map(
                              (id) =>
                                `Shared timeline event: ${timeline.find((event) => event.id === id)?.time || id}`,
                            ),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </article>
                    ),
                  )}
                </div>
              ) : (
                <p className="comparison-empty">
                  No other item has an explicit shared person or event link.
                </p>
              )}
            </div>
          </details>
          <details className="drawer-section">
            <summary>Contradictions, differences and limitations</summary>
            <div className="drawer-section-content">
              {explicitNotes.length ? (
                explicitNotes.map((entry) => (
                  <article
                    className="comparison-note comparison-recorded-note"
                    key={entry.id}
                  >
                    <span className="comparison-label">
                      RECORDED RELIABILITY NOTE · {entry.title}
                    </span>
                    <p>{entry.reliability.reason}</p>
                    <small>
                      This case-authored note is not necessarily a contradiction
                      with the selected record.
                    </small>
                  </article>
                ))
              ) : (
                <p className="comparison-empty">
                  No linked reliability note explicitly identifies a
                  contradiction.
                </p>
              )}
              <p className="comparison-muted">
                There is no separate structured contradiction list in this case
                schema. Recorded wording above is shown as a reliability note,
                not a confirmed conflict between records.
              </p>
              {comparisonItem && (
                <article className="comparison-note comparison-analysis-note">
                  <span className="comparison-label">
                    ANALYTICAL SUGGESTION · REVIEW, NOT A FACT
                  </span>
                  <p>
                    {item.timestamp && comparisonItem.timestamp
                      ? `The stored timestamps differ (${item.title}: ${item.timestamp}; ${comparisonItem.title}: ${comparisonItem.timestamp}). A time difference alone does not establish a conflict. Use the descriptions and linked timeline above to assess whether they may refer to different stages; the case data does not assign that interpretation.`
                      : 'At least one timestamp is missing, so the records cannot be compared by time from the available case data.'}
                  </p>
                  <p>
                    Reliability limitations:{' '}
                    {item.reliability?.reason || 'none recorded'} ·{' '}
                    {comparisonItem.reliability?.reason || 'none recorded'}.
                  </p>
                </article>
              )}
            </div>
          </details>
          <p className="comparison-disclaimer">
            <strong>Case records:</strong> evidence descriptions, sources,
            timestamps, confidence labels, reliability notes, and timeline
            certainty are shown as stored. Analytical suggestions do not
            identify a culprit.
          </p>
        </div>
      </section>
    </div>
  )
}
function EvidenceComparisonCard({ item, selected = false }) {
  return (
    <article
      className={`comparison-evidence-card ${selected ? 'comparison-selected' : ''}`}
    >
      <span className="comparison-label">
        {selected ? 'SELECTED EVIDENCE' : 'CASE EVIDENCE'} ·{' '}
        {item.type.replace('-', ' ')}
      </span>
      <h4>{item.title}</h4>
      <div className="comparison-card-meta">
        <div>
          <span>Source</span>
          <strong>{item.source || 'Not provided'}</strong>
        </div>
        <div>
          <span>Timestamp</span>
          <strong>{item.timestamp || 'Not provided'}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <Reliability label={item.reliability?.label || 'unverified'} />
        </div>
      </div>
      <p className="comparison-description">{item.content}</p>
      <p className="comparison-limit">
        <strong>Reliability note</strong>
        <span>
          {item.reliability?.reason || 'No reliability limitation is recorded.'}
        </span>
      </p>
    </article>
  )
}
function VerdictResult({ solution, record, caseData, investigationId }) {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(solution)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!solution && record.status === 'completed')
      api(`/investigations/${investigationId}/result`)
        .then((d) => setLoaded(d.solution))
        .catch((e) => setError(e.message))
  }, [solution, record.status, investigationId])
  if (error) return <div className="notice notice-error">{error}</div>
  if (!loaded) return <LoadingPage text="Unsealing the verdict…" />
  const correct = record.verdict?.correct
  return (
    <div className="verdict-result">
      <div
        className={`verdict-banner ${correct ? 'verdict-correct' : 'verdict-revisit'}`}
      >
        <span className="verdict-seal">
          {correct ? <Check size={22} /> : <Compass size={22} />}
        </span>
        <div>
          <span className="eyebrow">
            CASE CLOSED · {correct ? 'CORRECT ACCUSATION' : 'A DIFFERENT STORY'}
          </span>
          <h2>
            {correct
              ? 'Your reading of the clues was right.'
              : 'The evidence points to another account.'}
          </h2>
        </div>
      </div>
      <section className="result-card player-verdict-card">
        <span className="eyebrow">YOUR ACCUSATION</span>
        <h3>
          {caseData.suspects.find(
            (person) => person.id === record.verdict?.culpritId,
          )?.name || 'No suspect recorded'}
        </h3>
        <div className="player-verdict-details">
          <p>
            <strong>Your motive theory</strong>
            {record.verdict?.motive || 'No motive submitted.'}
          </p>
          <p>
            <strong>Your method theory</strong>
            {record.verdict?.method || 'No method submitted.'}
          </p>
          <p>
            <strong>Your reasoning</strong>
            {record.verdict?.explanation || 'No explanation submitted.'}
          </p>
        </div>
      </section>
      <div className="result-grid">
        <article className="result-card">
          <span className="eyebrow">THE CANONICAL SOLUTION</span>
          <h3>{loaded.culpritName}</h3>
          <p>
            <strong>Motive</strong> {loaded.motive}
          </p>
          <p>
            <strong>Method</strong> {loaded.method}
          </p>
          <div className="result-explanation">{loaded.explanation}</div>
        </article>
        <article className="result-card result-score">
          <span className="eyebrow">YOUR INVESTIGATION SCORE</span>
          <strong>{record.score}</strong>
          <span>points</span>
          <div className="score-breakdown">
            <span>
              Hints used <strong>{record.hintsUsed || 0}</strong>
            </span>
            <span>
              Evidence examined{' '}
              <strong>{record.discoveredEvidenceIds.length}</strong>
            </span>
            <span>
              Correct clues selected{' '}
              <strong>
                {record.verdict?.scoring?.relevantEvidenceIds?.length || 0}
              </strong>
            </span>
            <span>
              Clue points{' '}
              <strong>+{record.verdict?.scoring?.cluePoints || 0}</strong>
            </span>
            <span>
              Hint penalty{' '}
              <strong>−{record.verdict?.scoring?.hintPenalty || 0}</strong>
            </span>
          </div>
        </article>
      </div>
      <div className="result-evidence">
        <h3>Evidence you submitted</h3>
        {record.verdict?.supportingEvidenceIds?.length ? (
          record.verdict.supportingEvidenceIds.map((id) => {
            const item = caseData.evidence.find((entry) => entry.id === id)
            return (
              item && (
                <span className="evidence-chip" key={`submitted-${id}`}>
                  {item.title}
                </span>
              )
            )
          })
        ) : (
          <p className="muted-copy">
            No evidence was submitted with the accusation.
          </p>
        )}
      </div>
      <div className="result-evidence">
        <h3>Evidence supporting the solution</h3>
        {loaded.supportingEvidenceIds.map((id) => {
          const item = caseData.evidence.find((entry) => entry.id === id)
          return (
            item && (
              <span className="evidence-chip" key={id}>
                <Check size={13} />
                {item.title}
              </span>
            )
          )
        })}
      </div>
      <div className="result-actions">
        <Link to="/dashboard" className="button button-soft">
          Back to your desk <ArrowLeft size={14} />
        </Link>
        <button
          className="button button-primary"
          onClick={() => navigate('/cases/new')}
        >
          Create another mystery <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}

function ProfilePage() {
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [achievements, setAchievements] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([
      api('/users/me/stats'),
      api('/users/me/history'),
      api('/users/me/achievements'),
    ])
      .then(([s, h, a]) => {
        setStats(s.stats)
        setHistory(h.history)
        setAchievements(a.achievements)
      })
      .catch((e) => setError(e.message))
  }, [])
  return (
    <>
      <PageTitle
        eyebrow="YOUR DETECTIVE PROFILE"
        title="The cases you've carried."
        description="A record of your investigations, the stories you followed, and the clues you kept."
      />
      {error && <div className="notice notice-error">{error}</div>}
      <div className="stats-grid profile-stats">
        <StatCard
          label="Cases attempted"
          value={stats?.attempted ?? '—'}
          tint="stat-blush"
          note="Investigation history"
        />
        <StatCard
          label="Solved"
          value={stats?.solved ?? '—'}
          tint="stat-sage"
          note="Correct final accusations"
        />
        <StatCard
          label="Accuracy"
          value={stats ? `${stats.correctRate}%` : '—'}
          tint="stat-lavender"
          note="Across completed cases"
        />
        <StatCard
          label="Total points"
          value={stats?.totalPoints ?? '—'}
          tint="stat-butter"
          note={stats?.rank || 'Detective rank'}
        />
      </div>
      <section className="profile-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">YOUR CAREER</span>
            <h2>{stats?.rank || 'Trainee Detective'}</h2>
          </div>
          <span className="soft-badge">
            Average score · {stats?.averageScore ?? 0}
          </span>
        </div>
        <div className="achievement-list">
          {achievements.map((item) => (
            <article className="achievement-card" key={item.id}>
              <span className="achievement-icon">
                <Sparkles size={18} />
              </span>
              <div>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </div>
              <Check size={16} />
            </article>
          ))}
          {achievements.length === 0 && (
            <p className="muted-copy">
              Your first achievement will appear after a verdict.
            </p>
          )}
        </div>
      </section>
      <section className="profile-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">INVESTIGATION HISTORY</span>
            <h2>Every case leaves a trace.</h2>
          </div>
        </div>
        {history.length ? (
          <div className="case-list">
            {history.map((item) => (
              <article className="case-row" key={item.id}>
                <div className="case-row-icon">
                  <BookOpen size={18} />
                </div>
                <div className="case-row-copy">
                  <span className="difficulty-label">
                    {item.case?.difficulty || 'CASE'} ·{' '}
                    {item.status === 'completed' ? 'COMPLETED' : 'IN PROGRESS'}
                  </span>
                  <h3>{item.case?.title || 'Mystery case'}</h3>
                  <p>{item.case?.summary || 'Your investigation record.'}</p>
                </div>
                <div className="case-row-actions">
                  <span className="history-score">
                    {item.status === 'completed'
                      ? `${item.score} points`
                      : 'Open'}
                  </span>
                  <Link
                    className="button button-soft"
                    to={
                      item.status === 'completed'
                        ? `/investigations/${item.id}/result`
                        : `/investigations/${item.id}`
                    }
                  >
                    {item.status === 'completed' ? 'Result' : 'Continue'}{' '}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No investigations saved"
            text="Your case history will appear here."
          />
        )}
      </section>
    </>
  )
}

function RoomPage() {
  const { roomId } = useParams()
  const [room, setRoom] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [culprit, setCulprit] = useState('')
  const [solution, setSolution] = useState(null)
  const navigate = useNavigate()
  async function load() {
    try {
      const { room: data } = await api(`/rooms/${roomId}`)
      setRoom(data)
      if (data.solution) setSolution(data.solution)
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
  }, [roomId])
  async function updateProgress() {
    setBusy(true)
    setError('')
    try {
      await api(`/rooms/${roomId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          discoveredEvidenceIds: room.progress.discoveredEvidenceIds,
          theories: room.progress.theories,
        }),
      })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  async function findEvidence(id) {
    const ids = [...new Set([...room.progress.discoveredEvidenceIds, id])]
    setRoom({
      ...room,
      progress: { ...room.progress, discoveredEvidenceIds: ids },
    })
    setBusy(true)
    try {
      await api(`/rooms/${roomId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ discoveredEvidenceIds: ids }),
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await api(`/rooms/${roomId}/verdict`, {
        method: 'POST',
        body: JSON.stringify({
          culpritId: culprit,
          supportingEvidenceIds: room.progress.discoveredEvidenceIds,
        }),
      })
      setSolution(result.solution)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  if (error && !room) return <NoticePage error={error} />
  if (!room) return <LoadingPage text="Joining the shared case…" />
  return (
    <>
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={15} /> Your detective desk
      </Link>
      <PageTitle
        eyebrow="SHARED INVESTIGATION"
        title={room.case.title}
        description={`Room ${room.code} · Share this code with the detectives you invited.`}
        action={<RoomCodeCopy code={room.code} />}
      />
      {error && <div className="notice notice-error">{error}</div>}
      <div className="room-members">
        <span className="eyebrow">IN THE ROOM</span>
        {room.members.map((member) => (
          <span className="member-chip" key={member._id}>
            <span>{member.name?.[0]}</span>
            {member.name}
          </span>
        ))}
      </div>
      <div className="room-grid">
        <section className="panel-section">
          <div className="section-title">
            <div>
              <span className="eyebrow">SHARED EVIDENCE</span>
              <h2>What the team has found</h2>
            </div>
            <span className="soft-badge">
              {room.progress.discoveredEvidenceIds.length} discovered
            </span>
          </div>
          <div className="case-list">
            {room.case.evidence.map((item) => (
              <article className="room-evidence" key={item.id}>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                  <span className="difficulty-label">
                    {item.source} · {item.reliability.label}
                  </span>
                </div>
                {room.progress.discoveredEvidenceIds.includes(item.id) ? (
                  <span className="discovered-label">
                    <Check size={14} /> Shared
                  </span>
                ) : (
                  <button
                    className="button button-soft"
                    disabled={busy}
                    onClick={() => findEvidence(item.id)}
                  >
                    Share clue
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
        <SharedTheoryForm roomId={roomId} room={room} onSaved={load} />
        <aside className="aside-card room-team-card">
          <span className="eyebrow">TEAM VERDICT</span>
          <h3>
            {solution
              ? 'The case has been unsealed.'
              : room.teamVerdict
                ? 'Verdict submitted'
                : 'Ready when you are'}
          </h3>
          {solution ? (
            <>
              <strong>{solution.culpritName}</strong>
              <p>{solution.explanation}</p>
            </>
          ) : room.teamVerdict ? (
            <p>The room host has submitted the team accusation.</p>
          ) : (
            <form onSubmit={submit}>
              <label className="form-field">
                <span>Who do you accuse?</span>
                <select
                  value={culprit}
                  onChange={(e) => setCulprit(e.target.value)}
                  required
                >
                  <option value="">Choose a suspect</option>
                  {room.case.suspects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <p>
                {room.progress.discoveredEvidenceIds.length} shared clues will
                be considered.
              </p>
              <button
                className="button button-primary"
                disabled={busy || !culprit}
              >
                Submit team verdict <ArrowRight size={14} />
              </button>
            </form>
          )}
        </aside>
      </div>
    </>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/cases/new"
        element={
          <Protected>
            <CreateMysteryPage />
          </Protected>
        }
      />
      <Route
        path="/cases/:caseId/edit"
        element={
          <Protected>
            <EditCasePage />
          </Protected>
        }
      />
      <Route
        path="/cases/:caseId"
        element={
          <Protected>
            <CaseIntroPage />
          </Protected>
        }
      />
      <Route
        path="/investigations/:investigationId"
        element={
          <Protected>
            <WorkspacePage />
          </Protected>
        }
      />
      <Route
        path="/investigations/:investigationId/result"
        element={
          <Protected>
            <WorkspacePage />
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <ProfilePage />
          </Protected>
        }
      />
      <Route
        path="/rooms/:roomId"
        element={
          <Protected>
            <RoomPage />
          </Protected>
        }
      />
      <Route path="*" element={<LandingNotFound />} />
    </Routes>
  )
}
export default function WorkspaceApp() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

function RoomCodeCopy({ code }) {
  const [feedback, setFeedback] = useState(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  async function copy() {
    clearTimeout(timer.current)
    try {
      await writeRoomCodeToClipboard(code)
      setFeedback({ type: 'success', text: 'Room code copied!' })
    } catch {
      setFeedback({
        type: 'error',
        text: 'Could not copy the room code. Select and copy it manually.',
      })
    }
    timer.current = setTimeout(() => setFeedback(null), 3500)
  }
  return (
    <div className="room-code-copy">
      <button className="button button-soft" onClick={copy}>
        <Users size={15} /> Copy room code
      </button>
      {feedback && (
        <span
          className={`notice ${feedback.type === 'success' ? 'notice-success' : 'notice-error'}`}
          role={feedback.type === 'success' ? 'status' : 'alert'}
          aria-live="polite"
        >
          {feedback.text}
        </span>
      )}
    </div>
  )
}
