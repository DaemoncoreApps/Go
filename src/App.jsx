import { useEffect, useMemo, useRef, useState } from 'react'
import { lessons, totalMinutes, tracks } from './curriculum.js'
import { clearProgress, emptyProgress, exportProgress, loadProgress, saveProgress } from './progress.js'
import logo from './assets/daemoncore-go-logo.png'

const achievements = [
  ['First Compile', 1], ['Momentum', 5], ['Foundations Locked', 20], ['Data Tamer', 30],
  ['Halfway There', 50], ['Concurrency Ready', 60], ['API Builder', 80], ['Go Graduate', 100],
]

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
  const [hint, setHint] = useState(false)
  const [panel, setPanel] = useState(null)
  const [focus, setFocus] = useState(false)
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
    setLessonId(id); setTrackId(selected.trackId); setCode(selected.code); setStatus('idle'); setHint(false)
    setProgress((current) => ({ ...current, lastLesson: id }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function validate() {
    const passed = code.toLowerCase().includes(lesson.expected.toLowerCase())
    setStatus(passed ? 'passed' : 'review')
    setProgress((current) => {
      const firstPass = passed && !current.completed.includes(lesson.id)
      const today = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const streak = current.lastStudyDate === today ? current.streak : current.lastStudyDate === yesterday ? current.streak + 1 : 1
      return {
        ...current,
        completed: firstPass ? [...current.completed, lesson.id] : current.completed,
        attempts: { ...current.attempts, [lesson.id]: (current.attempts[lesson.id] ?? 0) + 1 },
        xp: current.xp + (firstPass ? 100 : 0), streak, lastStudyDate: today,
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

  return <div className={focus ? 'app focus' : 'app'}>
    <aside className="sidebar">
      <button className="brand" onClick={() => choose('welcome-to-go')} aria-label="Go to first lesson"><img src={logo} alt="DaemonCore Go" /></button>
      <section className="course-title"><span>DAEMONCORE ACADEMY</span><h1>Intro to Go</h1><p>Zero experience · {Math.round(totalMinutes / 60)} hours · fully offline</p></section>
      <section className="progress-card"><header><span>COURSE PROGRESS</span><b>{percent}%</b></header><div className="progress-rail"><i style={{ width: `${percent}%` }} /></div><footer><span>{progress.completed.length}/100 lessons</span><span>{progress.xp.toLocaleString()} XP · {progress.streak} day streak</span></footer></section>
      <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this path…" /></label>
      <label className="track-select"><span>LEARNING PATH</span><select value={trackId} onChange={(event) => { const id = event.target.value; setTrackId(id); setQuery(''); choose(lessons.find((item) => item.trackId === id).id) }}>{tracks.map((item) => <option key={item.id} value={item.id}>{String(item.number).padStart(2, '0')} · {item.title}</option>)}</select></label>
      <p className="track-overview">{activeTrack.overview}</p>
      <nav aria-label={`${activeTrack.title} lessons`}>{filtered.length ? filtered.map((item) => <button key={item.id} onClick={() => choose(item.id)} className={item.id === lesson.id ? 'active' : ''}><i>{progress.completed.includes(item.id) ? '✓' : String(item.number).padStart(2, '0')}</i><span><b>{item.title}</b><small>{item.duration} MIN</small></span>{progress.bookmarks.includes(item.id) && <em>◆</em>}</button>) : <p className="no-results">No lessons match.</p>}</nav>
      <footer className="side-footer"><button onClick={() => setPanel('progress')}>Progress center</button><span>v1.0.0 · STORE ID 9PFWTMFQFM7D</span></footer>
    </aside>

    <main>
      <header className="topbar"><div><i /> GO LEARNING ENVIRONMENT <span>/</span> OFFLINE</div><div><button onClick={() => setFocus(!focus)}>{focus ? 'EXIT FOCUS' : 'FOCUS MODE'}</button><button onClick={() => setPanel('shortcuts')}>SHORTCUTS</button></div></header>
      <article>
        <header className="lesson-hero"><div className="index">{String(lesson.number).padStart(3, '0')}</div><div><p>PATH {tracks.findIndex((item) => item.id === lesson.trackId) + 1} · LESSON {lesson.number} OF 100</p><h2>{lesson.title}</h2><span>{lesson.objective}</span></div><div className="lesson-actions"><button className={progress.bookmarks.includes(lesson.id) ? 'saved' : ''} onClick={bookmark}>◆ {progress.bookmarks.includes(lesson.id) ? 'SAVED' : 'SAVE'}</button><b>{lesson.duration}<small>MIN</small></b></div></header>

        <section className="roadmap" aria-label="Lesson sections">{lesson.sections.map((section, index) => <a key={section.name} href={`#section-${index + 1}`}><i>{index + 1}</i><span>{section.name}</span></a>)}</section>

        <div className="lesson-body">{lesson.sections.map((section, index) => <section className={`content-section section-${index + 1}`} id={`section-${index + 1}`} key={section.name}><header><span>{String(index + 1).padStart(2, '0')} //</span><h3>{section.name}</h3></header><p>{section.body}</p>{index === 2 && <pre className="code-display"><header><span>main.go</span><button onClick={() => navigator.clipboard?.writeText(lesson.code)}>COPY</button></header><code>{lesson.code}</code></pre>}{index === 3 && <div className="lab"><header><span>main.go · YOUR WORKSPACE</span><span>TRY · CHECK · REFINE</span></header><textarea aria-label="Go code practice editor" value={code} onChange={(event) => { setCode(event.target.value); setStatus('idle') }} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); validate() } if (event.key === 'Tab') { event.preventDefault(); const start = event.currentTarget.selectionStart; setCode(`${code.slice(0, start)}\t${code.slice(event.currentTarget.selectionEnd)}`); requestAnimationFrame(() => { event.currentTarget.selectionStart = event.currentTarget.selectionEnd = start + 1 }) } }} spellCheck="false" /><footer><button onClick={() => { setCode(lesson.code); setStatus('idle') }}>RESTORE EXAMPLE</button><button className="check" onClick={validate}>CHECK WORK <span>⌘↵</span></button></footer></div>}{index === 4 && <div className="mission"><span>MISSION</span><p>{lesson.task}</p></div>}{index === 5 && <button className="hint-button" onClick={() => setHint(!hint)}>{hint ? '− HIDE FIELD NOTE' : '+ OPEN FIELD NOTE'}</button>}{index === 5 && hint && <div className="hint"><b>FIELD NOTE</b><p>{lesson.hint}</p></div>}{index === 6 && <div className={`result ${status}`}><b>{status === 'passed' ? '✓ MASTERY CHECK PASSED' : status === 'review' ? '↻ NOT QUITE YET' : 'READY WHEN YOU ARE'}</b><p>{status === 'passed' ? 'You used the key idea and earned 100 XP. Change the example once more to make the understanding yours.' : status === 'review' ? `Your work does not show the expected concept yet. Look for “${lesson.expected}”, then check again.` : 'Use the code lab above. The check looks for the lesson’s key construct; your editor and Go toolchain provide the final compiler proof.'}</p></div>}{index === 7 && <textarea className="notes" value={progress.notes[lesson.id] ?? ''} onChange={(event) => note(event.target.value)} placeholder="Write your own takeaway… saved only on this device" aria-label="Personal lesson notes" />}</section>)}</div>

        <footer className="lesson-footer"><div><span>LESSON STATUS</span><b>{complete ? 'MASTERED' : 'IN PROGRESS'}</b></div>{next ? <button disabled={!complete} onClick={() => choose(next.id)}>NEXT · {next.title.toUpperCase()} <span>→</span></button> : <div className="graduate">{complete ? '◆ GO GRADUATE' : 'COMPLETE THE FINAL CHECK'}</div>}</footer>
      </article>
    </main>

    {panel && <div className="modal-backdrop" onMouseDown={() => setPanel(null)}><section className="modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setPanel(null)}>×</button>{panel === 'shortcuts' ? <><p className="eyebrow">WORK FASTER</p><h3>Keyboard shortcuts</h3><dl><div><dt>Ctrl / Cmd + Enter</dt><dd>Check the current code lab</dd></div><div><dt>Tab</dt><dd>Indent inside the code editor</dd></div><div><dt>Ctrl / Cmd + F</dt><dd>Use your system find command</dd></div></dl></> : <><p className="eyebrow">YOUR LOCAL PROFILE</p><h3>Progress center</h3><div className="stats"><div><b>{percent}%</b><span>COMPLETE</span></div><div><b>{progress.xp}</b><span>XP EARNED</span></div><div><b>{progress.bookmarks.length}</b><span>SAVED</span></div></div><h4>Achievements</h4><div className="achievements">{achievements.map(([name, target]) => <div className={progress.completed.length >= target ? 'earned' : ''} key={name}><i>{progress.completed.length >= target ? '◆' : '◇'}</i><span><b>{name}</b><small>{target} lesson{target === 1 ? '' : 's'}</small></span></div>)}</div><div className="data-actions"><button onClick={() => download(`daemoncore-go-progress-${new Date().toISOString().slice(0, 10)}.json`, exportProgress(progress))}>EXPORT BACKUP</button><button onClick={() => fileRef.current?.click()}>IMPORT BACKUP</button><button className="danger" onClick={reset}>RESET COURSE</button></div><input ref={fileRef} type="file" accept="application/json" hidden onChange={importFile} /></>}</section></div>}
    {status === 'import-error' && <div className="toast">That backup file could not be read.</div>}
  </div>
}

export default App
