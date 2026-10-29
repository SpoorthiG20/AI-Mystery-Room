import { Link, Route, Routes } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Compass,
  Fingerprint,
  Menu,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { useState } from 'react'

function Brand({ footer = false }) {
  return (
    <Link
      to="/"
      className={`brand ${footer ? 'brand-footer' : ''}`}
      aria-label="AI Mystery Room home"
    >
      <span className="brand-mark">
        <Fingerprint size={20} strokeWidth={1.7} />
      </span>
      <span>
        mystery<span className="brand-dot">.</span>
      </span>
    </Link>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Brand />
        <button
          className="menu-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav
          className={open ? 'main-nav nav-open' : 'main-nav'}
          aria-label="Main navigation"
        >
          <a href="#how-it-works" onClick={() => setOpen(false)}>
            How it works
          </a>
          <a href="#features" onClick={() => setOpen(false)}>
            The experience
          </a>
          <a href="#about" onClick={() => setOpen(false)}>
            Our approach
          </a>
          <Link
            className="nav-login"
            to="/login"
            onClick={() => setOpen(false)}
          >
            Log in
          </Link>
          <Link
            className="nav-cta"
            to="/register"
            onClick={() => setOpen(false)}
          >
            Get started <ArrowUpRight size={15} />
          </Link>
        </nav>
      </div>
    </header>
  )
}

function ClueCard({ icon: Icon, tint, label, title, text, className = '' }) {
  return (
    <article className={`clue-card ${className}`}>
      <div className={`clue-icon ${tint}`}>
        <Icon size={17} strokeWidth={1.7} />
      </div>
      <div className="clue-label">{label}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}

export function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <section className="hero section-shell">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" /> A little mystery, a lot of
              curiosity
            </div>
            <h1>
              Every detail
              <br />
              has a <em>story.</em>
            </h1>
            <p className="hero-lede">
              Step into a world of intriguing cases. Follow the clues, question
              what you know, and see where your curiosity takes you.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#get-started">
                Enter the mystery <ArrowRight size={16} />
              </a>
              <a className="text-link" href="#how-it-works">
                See how it works <ArrowDown size={15} />
              </a>
            </div>
            <div className="hero-note">
              <span className="note-sparkle">
                <Sparkles size={15} />
              </span>{' '}
              Thoughtful mysteries, made for curious minds
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Illustrated detective desk with case notes and clues"
          >
            <div className="art-wash wash-one" />
            <div className="art-wash wash-two" />
            <div className="desk-card card-back">
              <span className="paper-kicker">CASE NOTES · 014</span>
              <div className="paper-rule" />
              <div className="paper-rule short" />
              <div className="paper-rule" />
              <div className="paper-stamp">?</div>
            </div>
            <div className="desk-card card-main">
              <div className="case-top">
                <span>FIELD JOURNAL</span>
                <span>NO. 014</span>
              </div>
              <div className="case-sketch">
                <div className="sketch-window" />
                <div className="sketch-lamp" />
                <div className="sketch-book" />
                <div className="sketch-moon">✳</div>
              </div>
              <div className="case-caption">
                <span className="caption-line" />{' '}
                <span>THE HOLLOWAY LETTER</span>
              </div>
              <div className="case-subcaption">
                A note left behind. A story yet to unfold.
              </div>
            </div>
            <div className="floating-note">
              <span className="pin" />
              <span className="note-label">A curious detail</span>
              <span className="note-copy">
                The clock stopped
                <br />
                at 8:17 pm
              </span>
              <span className="note-doodle">↗</span>
            </div>
            <div className="floating-seal">
              <Compass size={20} strokeWidth={1.5} />
            </div>
            <div className="art-index">
              A study in small details <span>01 / 04</span>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="intro-section">
          <div className="section-shell intro-grid">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> HOW THE ROOM WORKS
              </div>
              <h2>
                A story is only
                <br />
                the <em>beginning.</em>
              </h2>
            </div>
            <div className="intro-copy">
              <p>
                Each mystery invites you to slow down and look closer. Gather
                what you find, follow the threads, and piece together what
                really happened—one thoughtful choice at a time.
              </p>
              <a href="#features" className="underlined-link">
                Take a closer look <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="features-section section-shell">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> YOUR INVESTIGATION
              </div>
              <h2>
                Clues worth <em>following.</em>
              </h2>
            </div>
            <p>
              Not a race to the answer. A space to notice, wonder, and connect
              the dots.
            </p>
          </div>
          <div className="clue-grid">
            <ClueCard
              icon={Search}
              tint="tint-blush"
              label="01 · OBSERVE"
              title="Look a little closer"
              text="Every case is filled with details to discover. Some speak plainly; others reward a second look."
            />
            <ClueCard
              icon={BookOpen}
              tint="tint-lavender"
              label="02 · CONSIDER"
              title="Hear every side"
              text="Meet the people connected to the mystery. Their memories, motives, and alibis are yours to explore."
            />
            <ClueCard
              icon={Compass}
              tint="tint-sage"
              label="03 · CONNECT"
              title="Find your own way"
              text="Arrange the pieces, test your ideas, and build a picture that makes sense to you."
            />
          </div>
        </section>

        <section id="about" className="quote-section">
          <div className="quote-inner">
            <span className="quote-mark">“</span>
            <blockquote>
              The truth is usually hiding
              <br />
              in the <em>details.</em>
            </blockquote>
            <span className="quote-credit">A NOTE FOR EVERY DETECTIVE</span>
          </div>
          <div className="quote-flower flower-left">✳</div>
          <div className="quote-flower flower-right">✳</div>
        </section>

        <section id="get-started" className="closing-section section-shell">
          <div className="closing-card">
            <div className="closing-ornament">
              <span>✳</span>
              <span>✳</span>
            </div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> THE FIRST CLUE IS YOURS
            </div>
            <h2>
              Ready to follow
              <br />a <em>story?</em>
            </h2>
            <p>Your next favorite mystery is just around the corner.</p>
            <Link className="button button-primary" to="/register">
              Find your first case <ArrowRight size={16} />
            </Link>
            <span className="closing-footnote">
              A quiet moment. A curious mind. Let's begin.
            </span>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-main section-shell">
          <div>
            <Brand footer />
            <p>
              A thoughtful place for curious minds
              <br />
              and stories waiting to be solved.
            </p>
          </div>
          <div className="footer-links">
            <a href="#how-it-works">How it works</a>
            <a href="#features">The experience</a>
            <a href="#about">Our approach</a>
          </div>
          <div className="footer-meta">
            <span>MADE FOR THE CURIOUS</span>
            <span>© 2025 AI Mystery Room</span>
          </div>
        </div>
      </footer>
    </>
  )
}

function NotFound() {
  return (
    <main className="not-found">
      <div className="eyebrow">
        <span className="eyebrow-line" /> WRONG TURN?
      </div>
      <h1>
        This clue leads
        <br />
        nowhere <em>yet.</em>
      </h1>
      <Link to="/" className="button button-primary">
        Back to the beginning <ChevronRight size={16} />
      </Link>
    </main>
  )
}

export function LandingNotFound() {
  return <NotFound />
}
