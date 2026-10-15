import { useEffect, useMemo, useRef, useState } from 'react'
import { lessons, totalMinutes, tracks } from './curriculum.js'
import { clearProgress, emptyProgress, exportProgress, loadProgress, saveProgress } from './progress.js'
import { validateSubmission } from './validation.js'
import logo from './assets/daemoncore-go-logo.png'

const achievements = [
  ['First Compile', 1], ['Momentum', 5], ['Foundations Locked', 20], ['Data Tamer', 30],
  ['Halfway There', 50], ['Concurrency Ready', 60], ['API Builder', 80], ['Go Graduate', 100],
]

const trackIcons = ['⌁', 'λ', '▦', '◇', '✓', '⇄', '▤', '◎', '⌘', '◆']

function AcademyHome({ progress, onContinue, onChoose, onProgress }) {
  const completedToday = progress.lastStudyDate === new Date().toISOString().slice(0, 10) ? 1 : 0
  const current = lessons.find((item) => item.id === progress.lastLesson) ?? lessons[0]
  return <article className="academy-home">
    <section className="home-hero">
      <div><p className="eyebrow">WELCOME BACK{progress.learnerName ? `, ${progress.learnerName.toUpperCase()}` : ''}</p><h2>Build real Go<br /><em>one clear step</em> at a time.</h2><p>From your first terminal command to a production-style web service. No gaps. No assumed knowledge. No internet required.</p><div className="hero-buttons"><button className="primary-cta" onClick={() => onContinue(current.id)}>CONTINUE · LESSON {current.number}<span>→</span></button><button onClick={onProgress}>VIEW PROGRESS</button></div></div>
      <div className="orbit-card"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><div><b>{progress.completed.length}</b><small>OF 100</small><strong>LESSONS MASTERED</strong></div></div>
    </section>
    <section className="home-metrics"><div><span>COURSE PROGRESS</span><b>{Math.round(progress.completed.length)}%</b><div className="metric-rail"><i style={{ width: `${progress.completed.length}%` }} /></div></div><div><span>CURRENT STREAK</span><b>{progress.streak}<small> DAYS</small></b><p>Consistency beats intensity.</p></div><div><span>TODAY'S TARGET</span><b>{completedToday}<small> / {progress.dailyGoal}</small></b><p>{completedToday >= progress.dailyGoal ? 'Daily target complete.' : 'One focused lesson at a time.'}</p></div><div><span>MASTERY SCORE</span><b>{progress.xp.toLocaleString()}<small> XP</small></b><p>100 XP per new mastery.</p></div></section>
    <header className="path-heading"><div><p className="eyebrow">THE COMPLETE ROADMAP</p><h3>Ten paths. One finished developer.</h3></div><p>Each path contains ten deliberate lessons. Move in order or jump to the exact skill you need.</p></header>
    <section className="path-grid">{tracks.map((track, index) => { const pathLessons = lessons.filter((item) => item.trackId === track.id); const done = pathLessons.filter((item) => progress.completed.includes(item.id)).length; return <button key={track.id} onClick={() => onChoose(pathLessons[0].id)}><header><i>{trackIcons[index]}</i><span>{String(track.number).padStart(2, '0')} / 10</span></header><h4>{track.title}</h4><p>{track.overview}</p><footer><div><i style={{ width: `${done * 10}%` }} /></div><span>{done}/10</span></footer></button> })}</section>
    <section className="promise"><div><span>◆</span><h3>The DaemonCore promise</h3></div><p>You will never be told to “just set it up” or “simply run the command.” Every tool, keystroke, error, and recovery step is part of the curriculum.</p><ul><li>100% offline</li><li>No account</li><li>No subscriptions</li><li>Your notes stay local</li></ul></section>
  </article>
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url)
}

function App() {
  const [progress, setProgress] = useState(loadProgress)
  const [lessonId, setLessonId] = useState(() => loadProgress().lastLesson)
  const lesson = lessons.find((item) => item.id === lessonId) ?? lessons[0]
  const [trackId, setTrackId] = useState(lesson.trackId)
  const [code, setCode] = useState(lesson.code)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle')
  const [feedback, setFeedback] = useState('')
  const [hint, setHint] = useState(false)
  const [panel, setPanel] = useState(null)
  const [focus, setFocus] = useState(false)
  const [view, setView] = useState('academy')
  const [learnerName, setLearnerName] = useState(progress.learnerName)
  const [goal, setGoal] = useState(progress.dailyGoal)
  const fileRef = useRef(null)
  const activeTrack = tracks.find((item) => item.id === trackId) ?? tracks[0]
  const filtered = useMemo(() => lessons.filter((item) => item.trackId === trackId && (!query || `${item.title} ${item.objective}`.toLowerCase().includes(query.toLowerCase()))), [trackId, query])
  const complete = progress.completed.includes(lesson.id)
  const percent = Math.round(progress.completed.length / lessons.length * 100)
  const next = lessons[lesson.number]

  useEffect(() => saveProgress(progress), [progress])

  function choose(id) {
    const selected = lessons.find((item) => item.id === id)
    if (!selected) return
    setLessonId(id); setTrackId(selected.trackId); setCode(selected.code); setStatus('idle'); setFeedback(''); setHint(false); setView('lesson')
    setProgress((current) => ({ ...current, lastLesson: id }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function validate() {
    const result = validateSubmission({ source: code, walkthrough: lesson.code, expected: lesson.expected })
    const passed = result.passed
    setStatus(result.kind)
    setFeedback(result.message)
    setProgress((current) => {
      const firstPass = passed && !current.completed.includes(lesson.id)
      const today = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const streak = current.lastStudyDate === today ? current.streak : current.lastStudyDate === yesterday ? current.streak + 1 : 1
      return {
        ...current,
        completed: firstPass ? [...current.completed, lesson.id] : current.completed,
        attempts: { ...current.attempts, [lesson.id]: (current.attempts[lesson.id] ?? 0) + 1 },
        xp: current.xp + (firstPass ? 100 : 0), streak: passed ? streak : current.streak, lastStudyDate: passed ? today : current.lastStudyDate,
      }
    })
  }

  function bookmark() { setProgress((current) => ({ ...current, bookmarks: current.bookmarks.includes(lesson.id) ? current.bookmarks.filter((id) => id !== lesson.id) : [...current.bookmarks, lesson.id] })) }
  function note(value) { setProgress((current) => ({ ...current, notes: { ...current.notes, [lesson.id]: value } })) }
  function reset() { clearProgress(); const clean = emptyProgress(); setProgress(clean); setPanel(null); choose(clean.lastLesson) }
  function importFile(event) {
    const file = event.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => { try { const value = JSON.parse(reader.result); if (!Array.isArray(value.completed)) throw new Error(); setProgress({ ...emptyProgress(), ...value }); choose(value.lastLesson ?? lessons[0].id); setPanel(null) } catch { setStatus('import-error') } }
    reader.readAsText(file); event.target.value = ''
  }

  function finishOnboarding() {
    setProgress((current) => ({ ...current, onboarded: true, learnerName: learnerName.trim().slice(0, 24), dailyGoal: Number(goal) }))
  }

  return <div className={focus ? 'app focus' : 'app'}>
    <aside className="sidebar">
      <button className="brand" onClick={() => { setView('academy'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} aria-label="Open academy home"><img src={logo} alt="DaemonCore Go" /></button>
      <section className="course-title"><span>DAEMONCORE ACADEMY</span><h1>Intro to Go</h1><p>Zero experience · {Math.round(totalMinutes / 60)} hours · fully offline</p></section>
      <section className="progress-card"><header><span>COURSE PROGRESS</span><b>{percent}%</b></header><div className="progress-rail"><i style={{ width: `${percent}%` }} /></div><footer><span>{progress.completed.length}/100 lessons</span><span>{progress.xp.toLocaleString()} XP · {progress.streak} day streak</span></footer></section>
      <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this path…" /></label>
      <label className="track-select"><span>LEARNING PATH</span><select value={trackId} onChange={(event) => { const id = event.target.value; setTrackId(id); setQuery(''); choose(lessons.find((item) => item.trackId === id).id) }}>{tracks.map((item) => <option key={item.id} value={item.id}>{String(item.number).padStart(2, '0')} · {item.title}</option>)}</select></label>
      <p className="track-overview">{activeTrack.overview}</p>
      <nav aria-label={`${activeTrack.title} lessons`}>{filtered.length ? filtered.map((item) => <button key={item.id} onClick={() => choose(item.id)} className={item.id === lesson.id ? 'active' : ''}><i>{progress.completed.includes(item.id) ? '✓' : String(item.number).padStart(2, '0')}</i><span><b>{item.title}</b><small>{item.duration} MIN</small></span>{progress.bookmarks.includes(item.id) && <em>◆</em>}</button>) : <p className="no-results">No lessons match.</p>}</nav>
      <footer className="side-footer"><button onClick={() => setView('academy')}>Academy home</button><button onClick={() => setPanel('progress')}>Progress center</button><span>v1.1.0 · STORE ID 9PFWTMFQFM7D</span></footer>
    </aside>

    <main>
      <header className="topbar"><div><i /> {view === 'academy' ? 'ACADEMY OVERVIEW' : 'GO LEARNING ENVIRONMENT'} <span>/</span> OFFLINE</div><div>{view === 'lesson' && <button onClick={() => setFocus(!focus)}>{focus ? 'EXIT FOCUS' : 'FOCUS MODE'}</button>}<button onClick={() => setPanel('shortcuts')}>SHORTCUTS</button></div></header>
      {view === 'academy' ? <AcademyHome progress={progress} onContinue={choose} onChoose={choose} onProgress={() => setPanel('progress')} /> : <article>
        <header className="lesson-hero"><div className="index">{String(lesson.number).padStart(3, '0')}</div><div><p>PATH {tracks.findIndex((item) => item.id === lesson.trackId) + 1} · LESSON {lesson.number} OF 100</p><h2>{lesson.title}</h2><span>{lesson.objective}</span></div><div className="lesson-actions"><button className={progress.bookmarks.includes(lesson.id) ? 'saved' : ''} onClick={bookmark}>◆ {progress.bookmarks.includes(lesson.id) ? 'SAVED' : 'SAVE'}</button><b>{lesson.duration}<small>MIN</small></b></div></header>

        <section className="roadmap" aria-label="Lesson sections">{lesson.sections.map((section, index) => <a key={section.name} href={`#section-${index + 1}`}><i>{index + 1}</i><span>{section.name}</span></a>)}</section>

        <div className="lesson-body">{lesson.sections.map((section, index) => <section className={`content-section section-${index + 1}`} id={`section-${index + 1}`} key={section.name}><header><span>{String(index + 1).padStart(2, '0')} //</span><h3>{section.name}</h3></header><p>{section.body}</p>{index === 2 && <pre className="code-display"><header><span>main.go</span><button onClick={() => navigator.clipboard?.writeText(lesson.code)}>COPY</button></header><code>{lesson.code}</code></pre>}{index === 3 && <div className="lab"><header><span>main.go · YOUR WORKSPACE</span><span>EDIT · CHECK · REFINE</span></header><div className="editor-gutter" aria-hidden="true">{code.split('\n').map((_, line) => <span key={line}>{line + 1}</span>)}</div><textarea aria-label="Go code practice editor" value={code} onChange={(event) => { setCode(event.target.value); setStatus('idle'); setFeedback('') }} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); validate() } if (event.key === 'Tab') { event.preventDefault(); const start = event.currentTarget.selectionStart; setCode(`${code.slice(0, start)}\t${code.slice(event.currentTarget.selectionEnd)}`); requestAnimationFrame(() => { event.currentTarget.selectionStart = event.currentTarget.selectionEnd = start + 1 }) } }} spellCheck="false" /><footer><button onClick={() => { setCode(lesson.code); setStatus('idle'); setFeedback('') }}>RESTORE EXAMPLE</button><span className="edit-state">{code === lesson.code ? 'MAKE A CHANGE TO BEGIN' : '● UNSAVED LAB CHANGE'}</span><button className="check" onClick={validate}>CHECK WORK <span>CTRL ↵</span></button></footer></div>}{index === 4 && <div className="mission"><span>MISSION</span><p>{lesson.task}</p></div>}{index === 5 && <button className="hint-button" onClick={() => setHint(!hint)}>{hint ? '− HIDE FIELD NOTE' : '+ OPEN FIELD NOTE'}</button>}{index === 5 && hint && <div className="hint"><b>FIELD NOTE</b><p>{lesson.hint}</p></div>}{index === 6 && <div className={`result ${status}`}><header><span className="terminal-dots"><i /><i /><i /></span><span>MASTERY CONSOLE</span></header><b>{status === 'passed' ? '✓ CHECK PASSED' : status === 'syntax' ? '× SOURCE REJECTED' : status === 'idle' ? '> AWAITING YOUR SUBMISSION' : '↻ REVISION REQUIRED'}</b><p>{status === 'passed' ? 'Structure and lesson objective verified. +100 XP on first mastery.' : feedback || 'The check verifies basic Go structure, a meaningful edit, and the lesson’s target concept. Use your local Go toolchain for compiler-level proof.'}</p></div>}{index === 7 && <textarea className="notes" value={progress.notes[lesson.id] ?? ''} onChange={(event) => note(event.target.value)} placeholder="What clicked? What would you explain to another beginner? Saved only on this device." aria-label="Personal lesson notes" />}</section>)}</div>

        <footer className="lesson-footer"><div><span>LESSON STATUS</span><b>{complete ? 'MASTERED' : 'IN PROGRESS'}</b></div>{next ? <button disabled={!complete} onClick={() => choose(next.id)}>NEXT · {next.title.toUpperCase()} <span>→</span></button> : <div className="graduate">{complete ? '◆ GO GRADUATE' : 'COMPLETE THE FINAL CHECK'}</div>}</footer>
      </article>}
    </main>

    {panel && <div className="modal-backdrop" onMouseDown={() => setPanel(null)}><section className="modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setPanel(null)}>×</button>{panel === 'shortcuts' ? <><p className="eyebrow">WORK FASTER</p><h3>Keyboard shortcuts</h3><dl><div><dt>Ctrl / Cmd + Enter</dt><dd>Check the current code lab</dd></div><div><dt>Tab</dt><dd>Indent inside the code editor</dd></div><div><dt>Ctrl / Cmd + F</dt><dd>Use your system find command</dd></div></dl></> : <><p className="eyebrow">YOUR LOCAL PROFILE</p><h3>Progress center</h3><div className="stats"><div><b>{percent}%</b><span>COMPLETE</span></div><div><b>{progress.xp}</b><span>XP EARNED</span></div><div><b>{progress.bookmarks.length}</b><span>SAVED</span></div></div><h4>Achievements</h4><div className="achievements">{achievements.map(([name, target]) => <div className={progress.completed.length >= target ? 'earned' : ''} key={name}><i>{progress.completed.length >= target ? '◆' : '◇'}</i><span><b>{name}</b><small>{target} lesson{target === 1 ? '' : 's'}</small></span></div>)}</div><div className="data-actions"><button onClick={() => download(`daemoncore-go-progress-${new Date().toISOString().slice(0, 10)}.json`, exportProgress(progress))}>EXPORT BACKUP</button><button onClick={() => fileRef.current?.click()}>IMPORT BACKUP</button><button className="danger" onClick={reset}>RESET COURSE</button></div><input ref={fileRef} type="file" accept="application/json" hidden onChange={importFile} /></>}</section></div>}
    {status === 'import-error' && <div className="toast">That backup file could not be read.</div>}
    {!progress.onboarded && <div className="onboarding"><section><div className="onboarding-brand"><img src={logo} alt="DaemonCore Go" /><span>PREMIUM OFFLINE ACADEMY</span></div><p className="eyebrow">WELCOME TO YOUR NEW SKILL</p><h2>Start from zero.<br />Finish by shipping.</h2><p className="onboarding-copy">We’ll teach the tools, the language, and the professional workflow. Set a pace that feels sustainable—you can change it later.</p><label><span>WHAT SHOULD WE CALL YOU? <em>OPTIONAL</em></span><input autoFocus value={learnerName} onChange={(event) => setLearnerName(event.target.value)} maxLength="24" placeholder="Your first name" /></label><fieldset><legend>DAILY LEARNING TARGET</legend>{[[1,'Steady','~15 min'],[2,'Committed','~30 min'],[3,'Intensive','~45 min']].map(([value,name,time]) => <button className={Number(goal) === value ? 'selected' : ''} key={value} onClick={() => setGoal(value)}><b>{value}</b><span><strong>{name}</strong><small>{time}</small></span></button>)}</fieldset><button className="begin" onClick={finishOnboarding}>ENTER THE ACADEMY <span>→</span></button><small>Progress and notes stay on this device. No account required.</small></section></div>}
  </div>
}

export default App
