import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const USERS_KEY = 'jot-demo-users-v2';
const SESSION_KEY = 'jot-demo-session-v2';
const DATA_PREFIX = 'jot-demo-data-v2:';
const POPUP_STATE_KEY = 'jot-demo-popup-state-v1';
const WORDS = 'ledger window amber signal quiet claim office paper record prompt number drawer parcel stamp focus ribbon socket uneven token queue desk silver urgent maple envelope account maybe cursor careful field schedule printer brief copper file name deadline object swiftly proof button retry calendar motion pixel gentle verify yellow folder mention simple echo device line value index'.split(' ');
const NAGS = [
  ['WAIT A SECOND...', 'Are you sure you completed that task?', 'Just double-checking.'],
  ['ARE YOU REALLY SURE?', "Bro, I don't think you finished it...", 'Please check once.'],
  ['ONE MORE THING.', 'You actually finished the entire task?', 'Not just half of it, right?'],
  ['HONESTLY NOW.', 'That was suspiciously quick.', 'Take a moment and think about it.'],
  ['FINAL ANSWER?', 'Are you absolutely, completely sure?', 'We need you to be certain.'],
  ['BRO. COME ON.', "There's no way you finished that already.", 'Please review your work.'],
  ['JUST CHECKING...', "You didn't accidentally click that, did you?", 'It happens to the best of us.'],
  ['A QUICK QUESTION.', 'Would you bet your lunch on that answer?', 'Think carefully.'],
  ['SOMETHING FEELS OFF.', "I have a feeling you're forgetting something.", 'Go over the task in your head.'],
  ['LAST LITTLE CHECK.', 'You really did everything you planned?', 'Every single part of it?'],
  ['HOLD ON.', 'Can you confirm that one more time?', 'We like to be thorough.'],
  ['QUICK REALITY CHECK.', 'Was that actually finished, or just mostly finished?', "There's a difference."],
  ['WE HAVE A QUESTION.', "You wouldn't mark something incomplete as complete, would you?", 'Of course not.'],
  ['STILL HERE.', "Just making sure we're on the same page.", 'You can never be too careful.'],
  ['ONE LAST LOOK.', 'Anything you forgot to do?', 'Take your time thinking about it.'],
];

const readJSON = (key, fallback = null) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const getUsers = () => readJSON(USERS_KEY, []) || [];
const findUser = email => getUsers().find(user => user.email === email) || null;
const loadData = user => {
  const saved = user ? readJSON(DATA_PREFIX + user.email.toLowerCase(), {}) : {};
  const tasks = Array.isArray(saved.tasks) ? saved.tasks : [];
  return {
    tasks,
    stats: {
      lifetimeCreated: Number(saved.lifetimeCreated) || 0,
      lifetimeCompleted: Number(saved.lifetimeCompleted) || 0,
      nextNumber: Math.max(Number(saved.nextNumber) || 1, ...tasks.map(task => (Number(task.number) || 0) + 1), 1),
    },
  };
};
const persistData = (user, tasks, stats) => {
  if (!user) return;
  localStorage.setItem(DATA_PREFIX + user.email.toLowerCase(), JSON.stringify({ tasks, ...stats }));
};
const localDateTime = (date = new Date(Date.now() + 86400000)) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
const isOverdue = task => !task.completed && new Date(task.deadline).getTime() < Date.now();
const formatDate = value => new Date(value).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
const passage = () => Array.from({ length: 40 + Math.floor(Math.random() * 11) }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(' ') + '.';
const nextCorner = previous => {
  const corners = ['close-top-left', 'close-top-right', 'close-bottom-left', 'close-bottom-right'].filter(corner => corner !== previous);
  return corners[Math.floor(Math.random() * corners.length)];
};
const randomWindowPosition = (previous, width = 410, height = 290) => {
  const margin = 14;
  const maxLeft = Math.max(margin, window.innerWidth - Math.min(width, window.innerWidth - margin * 2) - margin);
  const maxTop = Math.max(margin, window.innerHeight - Math.min(height, window.innerHeight - margin * 2) - margin);
  let position = { left: margin, top: margin };
  for (let attempt = 0; attempt < 10; attempt += 1) {
    position = {
      left: Math.round(margin + Math.random() * (maxLeft - margin)),
      top: Math.round(margin + Math.random() * (maxTop - margin)),
    };
    if (!previous || Math.hypot(position.left - previous.left, position.top - previous.top) > 120) break;
  }
  return position;
};

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('register');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = mode === 'register';
  function submit(event) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const users = getUsers();
    if (!normalizedEmail || password.length < 6) return setError('Enter a valid email and a password with at least 6 characters.');
    if (register) {
      if (!name.trim()) return setError('Please enter your name.');
      if (users.some(user => user.email === normalizedEmail)) return setError('An account with this email already exists. Try signing in.');
      const user = { name: name.trim(), email: normalizedEmail, password };
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
      localStorage.setItem(SESSION_KEY, normalizedEmail);
      onAuth(user);
    } else {
      const user = users.find(item => item.email === normalizedEmail && item.password === password);
      if (!user) return setError('That email and password combination was not recognised.');
      localStorage.setItem(SESSION_KEY, normalizedEmail);
      onAuth(user);
    }
  }
  return <section className="auth-screen">
    <div className="auth-card">
      <a href="#" className="brand auth-brand">JOT<span>_</span></a>
      <p className="eyebrow">YOUR PERSONAL SPACE</p>
      <h1>{register ? <>A little more<br /><em>organised.</em></> : <>Good to have<br /><em>you back.</em></>}</h1>
      <p className="auth-copy">A calmer place to keep track of what matters. Completion claims may be subject to review.</p>
      <div className="auth-tabs">
        <button type="button" className={`auth-tab ${register ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
        <button type="button" className={`auth-tab ${!register ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
      </div>
      <form id="authForm" onSubmit={submit}>
        {register && <><label htmlFor="authName">YOUR NAME</label><input id="authName" placeholder="Your name" autoComplete="name" maxLength="50" required value={name} onChange={event => setName(event.target.value)} /></>}
        <label htmlFor="authEmail">EMAIL ADDRESS</label><input id="authEmail" type="email" placeholder="you@example.com" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
        <label htmlFor="authPassword">PASSWORD</label><input id="authPassword" type="password" placeholder="At least 6 characters" minLength="6" autoComplete={register ? 'new-password' : 'current-password'} required value={password} onChange={event => setPassword(event.target.value)} />
        <p className="auth-error">{error}</p><button type="submit" id="authSubmit" className="button button-primary">{register ? 'Create my account ↗' : 'Sign in ↗'}</button>
      </form>
      <p className="auth-footnote">JOT / PERSONAL TASK MANAGEMENT</p>
    </div>
    <div className="auth-side"><span className="side-label"><span className="status-dot" />YOUR SPACE / UNDER REVIEW</span><div className="side-quote">One thing at a time.<br />Then a few<br />follow-up questions.</div><div className="side-bottom"><span>JOT / 001</span><span>EST. TODAY</span></div></div>
  </section>;
}

function TypingGate({ task, onAccepted }) {
  const [text, setText] = useState(passage);
  const [value, setValue] = useState('');
  const [started, setStarted] = useState(null);
  const [now, setNow] = useState(Date.now());
  const inputRef = useRef(null);
  useEffect(() => { if (!started) return undefined; const timer = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(timer); }, [started]);
  const elapsed = started ? Math.max(0.1, (now - started) / 1000) : 0;
  const correct = [...value].filter((character, index) => character === text[index]).length;
  const accuracy = value.length ? Math.round(correct / value.length * 100) : 100;
  const wpm = elapsed ? Math.round((value.length / 5) / (elapsed / 60)) : 0;
  const complete = value.length === text.length;
  const exact = complete && value === text && accuracy === 100;
  const ready = exact && wpm >= 50;
  function reset() { setValue(''); setStarted(null); setNow(Date.now()); requestAnimationFrame(() => inputRef.current?.focus()); }
  function change(event) { const next = event.target.value; if (next.length && !started) setStarted(Date.now()); setValue(next); }
  function keyDown(event) {
    if (['Backspace', 'Delete', 'Enter'].includes(event.key) || ((event.ctrlKey || event.metaKey) && ['a', 'x', 'v'].includes(event.key.toLowerCase()))) event.preventDefault();
    if (inputRef.current && inputRef.current.selectionStart !== inputRef.current.value.length) requestAnimationFrame(() => inputRef.current?.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length));
  }
  return <div className="gate-backdrop"><section className="essay-modal typing-modal" role="dialog" aria-modal="true" aria-labelledby="essayTitle">
    <p className="eyebrow">DEADLINE REVIEW / REQUIRED</p><h2 id="essayTitle">Typing verification.</h2>
    <p className="essay-description">The deadline for <strong>{task.title}</strong> has passed. Reproduce this randomly generated record at <strong>50 words per minute</strong>, with <strong>100% accuracy</strong>. Corrections are not accepted.</p>
    <div className="typing-stats"><div><strong>{wpm}</strong><span>YOUR WPM</span></div><div><strong>{accuracy}%</strong><span>ACCURACY</span></div><div><strong>50</strong><span>REQUIRED WPM</span></div><div><strong>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(Math.floor(elapsed % 60)).padStart(2, '0')}</strong><span>ELAPSED</span></div></div>
    <div className="typing-prompt" aria-label="Text to type">{[...text].map((character, index) => <span key={index} className={index < value.length ? (value[index] === character ? 'correct' : 'incorrect') : index === value.length ? 'next-char' : ''}>{character}</span>)}</div>
    <label className="essay-label" htmlFor="typingInput">TYPE THE RECORD EXACTLY · NO BACKSPACE</label>
    <textarea ref={inputRef} id="typingInput" rows="4" maxLength={text.length} autoComplete="off" autoCapitalize="off" spellCheck="false" placeholder="Start typing to begin the timer..." value={value} onChange={change} onKeyDown={keyDown} onBeforeInput={event => { if (event.nativeEvent.inputType?.startsWith('delete')) event.preventDefault(); }} onPaste={event => event.preventDefault()} onCut={event => event.preventDefault()} onDrop={event => event.preventDefault()} onPointerUp={event => event.currentTarget.setSelectionRange(event.currentTarget.value.length, event.currentTarget.value.length)} />
    <p id="essayError" role="status" aria-live="polite">{ready ? `Perfect. ${wpm} WPM · 100% accuracy. Ready for review.` : complete ? accuracy < 100 ? `REJECTED · ${accuracy}% accuracy. Restart is now available; corrections are locked.` : `REJECTED · ${wpm} WPM. The fixed target is 50. Restart is now available.` : accuracy < 100 ? `ERROR LOCKED · ${accuracy}% accuracy. Finish the passage to unlock restart.` : 'Target 50 WPM · 100% accuracy required. Restart unlocks at the end of the passage.'}</p>
    <div className="typing-actions"><button type="button" id="resetTypingTest" disabled={!complete} onClick={reset}>RESTART ATTEMPT</button><button type="button" id="submitEssay" disabled={!ready} onClick={() => onAccepted()}>SUBMIT FOR REVIEW ↗</button></div>
  </section></div>;
}

function PopupWindow({ popup, onClose, onMinimize, onRestore }) {
  const drag = useRef(null);
  const modalRef = useRef(null);
  const lastPopupNumber = useRef(popup.number);
  const [position, setPosition] = useState(() => randomWindowPosition());
  useEffect(() => {
    if (lastPopupNumber.current === popup.number) return;
    const rect = modalRef.current?.getBoundingClientRect();
    setPosition(current => randomWindowPosition(current, rect?.width || 410, rect?.height || 290));
    lastPopupNumber.current = popup.number;
  }, [popup.number]);
  useEffect(() => {
    const resize = () => {
      const rect = modalRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition(current => ({
        left: Math.max(8, Math.min(Math.max(8, window.innerWidth - rect.width - 8), current.left)),
        top: Math.max(8, Math.min(Math.max(8, window.innerHeight - rect.height - 8), current.top)),
      }));
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  function pointerDown(event) {
    if (event.target.closest('button')) return;
    const rect = event.currentTarget.parentElement.getBoundingClientRect();
    drag.current = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event) {
    if (!drag.current) return;
    const rect = modalRef.current?.getBoundingClientRect();
    const width = rect?.width || 410;
    const height = rect?.height || 290;
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - height - 8);
    setPosition({
      left: Math.max(8, Math.min(maxLeft, drag.current.left + event.clientX - drag.current.x)),
      top: Math.max(8, Math.min(maxTop, drag.current.top + event.clientY - drag.current.y)),
    });
  }
  return <div id="nagModalOverlay" className={popup.minimized ? 'window-minimized' : ''}>
    <section ref={modalRef} className={`nag-modal ${popup.corner}`} style={position || {}} role="dialog" aria-modal="false" aria-labelledby="nagPopupTitle">
      <div className="nag-modal-top" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}><span className="nag-window-app"><i />JOT TASK REVIEW</span><span id="nagPopupCount">REVIEW IN PROGRESS</span><div className="nag-window-controls"><button type="button" aria-label="Minimize confirmation" onClick={onMinimize}>—</button></div></div>
      <div className="nag-window-body"><div className="nag-window-caption"><span className="nag-modal-icon">!</span><span>FILE MANAGER / SYSTEM MESSAGE</span></div><h2 id="nagPopupTitle">{popup.message[0]}</h2><p className="nag-message">{popup.message[1]}</p><p className="nag-detail">{popup.message[2]}</p><p className="nag-error">{popup.error || ''}</p><div className="nag-window-footer"><span>JOT / COMPLETION SERVICE</span><span>RESPONSE REQUIRED</span></div></div>
      <button type="button" className="nag-close-corner" aria-label="Close confirmation" onClick={onClose}>×</button>
    </section>
    {popup.minimized && <div className="nag-minimized-tray"><button type="button" onClick={onRestore}>JOT REVIEW WINDOW — RESTORE</button></div>}
  </div>;
}

function App() {
  const [user, setUser] = useState(() => findUser(localStorage.getItem(SESSION_KEY)));
  const initialData = useMemo(() => loadData(user), []); // hydrate once; account transitions are handled in onAuth/signOut
  const [tasks, setTasks] = useState(initialData.tasks);
  const [stats, setStats] = useState(initialData.stats);
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(null);
  const [overdueTaskId, setOverdueTaskId] = useState(null);
  const [popup, setPopup] = useState(() => {
    const saved = readJSON(POPUP_STATE_KEY);
    return saved && user && saved.userEmail === user.email ? saved : null;
  });
  const [clock, setClock] = useState(Date.now());
  const [lastCorner, setLastCorner] = useState(popup?.corner || null);
  const audioRef = useRef(null);
  const soundTimers = useRef([]);
  const displayedTasks = tasks.filter(task => filter === 'open' ? !task.completed : filter === 'done' ? task.completed : true);
  const currentOverdue = overdueTaskId ? tasks.find(task => task.id === overdueTaskId && !task.essayDone) : null;

  const save = useCallback((nextTasks, nextStats = stats, account = user) => persistData(account, nextTasks, nextStats), [stats, user]);
  useEffect(() => { if (user) save(tasks, stats); }, [user, tasks, stats, save]);
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 15000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!user || popup || overdueTaskId) return undefined;
    const overdue = tasks.find(task => isOverdue(task) && !task.essayDone);
    if (overdue) setOverdueTaskId(overdue.id);
    return undefined;
  }, [user, tasks, popup, overdueTaskId, clock]);
  useEffect(() => {
    if (!popup) { localStorage.removeItem(POPUP_STATE_KEY); return; }
    localStorage.setItem(POPUP_STATE_KEY, JSON.stringify({ ...popup, userEmail: user?.email }));
  }, [popup, user]);
  useEffect(() => {
    if (!popup) return undefined;
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    let context;
    try {
      if (AudioEngine) {
        context = new AudioEngine();
        audioRef.current = context;
        context.resume().catch(() => {});
        const notes = [392, 440, 523.25, 440, 349.23, 392, 523.25, 587.33];
        let step = 0;
        const play = () => {
          if (context.state !== 'running') return;
          const at = context.currentTime;
          for (const [frequency, gainValue] of [[notes[step++ % notes.length], 0.72], [notes[step % notes.length] * 1.5, 0.22]]) {
            const oscillator = context.createOscillator(); const gain = context.createGain();
            oscillator.type = 'sine'; oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.0001, at); gain.gain.exponentialRampToValueAtTime(gainValue, at + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
            oscillator.connect(gain); gain.connect(context.destination); oscillator.start(at); oscillator.stop(at + 0.31);
          }
        };
        const music = setInterval(play, 360); soundTimers.current.push(music);
        const idle = setTimeout(() => {
          const chime = () => {
            if (context.state !== 'running') return;
            const at = context.currentTime; const oscillator = context.createOscillator(); const gain = context.createGain();
            oscillator.type = 'square'; oscillator.frequency.setValueAtTime(880, at); oscillator.frequency.exponentialRampToValueAtTime(180, at + 0.19);
            gain.gain.setValueAtTime(0.001, at); gain.gain.exponentialRampToValueAtTime(0.14, at + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.25);
            oscillator.connect(gain); gain.connect(context.destination); oscillator.start(at); oscillator.stop(at + 0.26);
          };
          chime(); soundTimers.current.push(setInterval(chime, 1150));
        }, 1500);
        soundTimers.current.push(idle);
      }
    } catch { context = null; }
    return () => {
      soundTimers.current.forEach(timer => { clearTimeout(timer); clearInterval(timer); }); soundTimers.current = [];
      if (context && context.state !== 'closed') context.close().catch(() => {});
      audioRef.current = null;
    };
  }, [popup?.number, !!popup]);

  function handleAuth(account) {
    const data = loadData(account);
    setTasks(data.tasks); setStats(data.stats); setUser(account);
    const saved = readJSON(POPUP_STATE_KEY);
    if (saved?.userEmail === account.email) setPopup(saved);
  }
  function signOut() {
    localStorage.removeItem(SESSION_KEY); localStorage.removeItem(POPUP_STATE_KEY);
    setPopup(null); setUser(null); setTasks([]); setStats({ lifetimeCreated: 0, lifetimeCompleted: 0, nextNumber: 1 }); setOverdueTaskId(null);
  }
  function addTask(event) {
    event.preventDefault(); if (popup || currentOverdue) return;
    const form = new FormData(event.currentTarget); const title = String(form.get('title') || '').trim(); const deadline = new Date(String(form.get('deadline') || ''));
    if (!title || Number.isNaN(deadline.getTime())) return;
    const task = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, number: stats.nextNumber, title, deadline: deadline.toISOString(), priority: String(form.get('priority')), completed: false, completedAt: null, essayDone: false };
    const nextTasks = [...tasks, task]; const nextStats = { ...stats, lifetimeCreated: stats.lifetimeCreated + 1, nextNumber: stats.nextNumber + 1 };
    setTasks(nextTasks); setStats(nextStats); save(nextTasks, nextStats); event.currentTarget.reset();
    if (isOverdue(task)) setOverdueTaskId(task.id);
  }
  function beginPopup() {
    const first = NAGS[Math.floor(Math.random() * NAGS.length)]; const total = 15 + Math.floor(Math.random() * 6); const corner = nextCorner(lastCorner);
    setLastCorner(corner); setPopup({ total, number: 1, message: first, minimized: false, corner, error: '' });
  }
  function completeTask(task) {
    if (isOverdue(task) && !task.essayDone) { setOverdueTaskId(task.id); return; }
    if (task.completed || popup) return;
    const nextTasks = tasks.map(item => item.id === task.id ? { ...item, completed: true, completedAt: new Date().toISOString() } : item);
    const nextStats = { ...stats, lifetimeCompleted: stats.lifetimeCompleted + 1 };
    setTasks(nextTasks); setStats(nextStats); save(nextTasks, nextStats); beginPopup();
  }
  function closePopup() {
    if (!popup) return;
    if (popup.number >= popup.total) { setPopup(null); setNotice({ title: 'FINALLY.', message: "All right. We'll accept that.", detail: 'Your task was saved successfully.' }); return; }
    const message = NAGS[Math.floor(Math.random() * NAGS.length)]; const corner = nextCorner(popup.corner);
    setLastCorner(corner); setPopup({ ...popup, message, corner, number: popup.number + 1, error: '', minimized: false });
  }
  function removeTask(task) {
    if (!window.confirm('Remove this task from your active list? Lifetime totals and task numbering will stay unchanged.')) return;
    const next = tasks.filter(item => item.id !== task.id); setTasks(next); save(next);
  }
  function acceptTyping() {
    if (!currentOverdue) return;
    const nextTasks = tasks.map(task => task.id === currentOverdue.id ? { ...task, essayDone: true, essaySubmittedAt: new Date().toISOString() } : task);
    setTasks(nextTasks); save(nextTasks); setOverdueTaskId(null); setNotice({ title: 'SPEED REPORT ACCEPTED', message: 'The typing verification is complete.', detail: 'You may resume your session.' });
  }
  function resetData() {
    if (!window.confirm("Reset this account's tasks and lifetime totals? This cannot be undone.")) return;
    const nextStats = { lifetimeCreated: 0, lifetimeCompleted: 0, nextNumber: 1 }; setTasks([]); setStats(nextStats); save([], nextStats); setNotice({ title: 'REGISTER CLEARED', message: 'Your demo data has been reset.', detail: 'A fresh page is ready.' });
  }
  function deleteNotice() { setNotice(null); }

  if (!user) return <><AuthScreen onAuth={handleAuth} />{notice && <div className="toast" role="status"><strong>{notice.title}</strong><span>{notice.message}</span><button onClick={deleteNotice} aria-label="Dismiss">×</button></div>}</>;
  const firstName = user.name.split(' ')[0];
  return <div className="jot-app">
    <header className="topbar"><a href="#top" className="brand">JOT<span>_</span></a><nav className="navigation"><a href="#tasks">MY TASKS</a><a href="#history">MY PROGRESS</a></nav><div className="user-menu"><span className="avatar">{(user.name.trim()[0] || 'J').toUpperCase()}</span><span>{user.name}</span><button type="button" className="quiet-button" onClick={signOut}>Sign out</button></div></header>
    <main className="container" id="top">
      <section className="welcome"><div><p className="eyebrow">YOUR DAY, AT A GLANCE</p><h1>{clock && new Date(clock).getHours() < 12 ? 'Good morning' : new Date(clock).getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {firstName}.</h1><p className="subtitle">A little progress is still subject to confirmation.</p></div><div className="date-card"><span className="date-kicker">TODAY IS</span><strong>{new Date(clock).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}</strong><span className="date-caption">One thing at a time.</span></div></section>
      <section className="stats"><article className="stat-card"><span className="stat-label">TASKS CREATED</span><strong>{String(stats.lifetimeCreated).padStart(2, '0')}</strong><span className="stat-note">Across your whole journey</span></article><article className="stat-card"><span className="stat-label">COMPLETED EVER</span><strong>{String(stats.lifetimeCompleted).padStart(2, '0')}</strong><span className="stat-note">Every finished task counts</span></article><article className="stat-card"><span className="stat-label">ON YOUR LIST</span><strong>{String(tasks.filter(task => !task.completed).length).padStart(2, '0')}</strong><span className="stat-note">Still in progress</span></article></section>
      <section className="task-section" id="tasks"><div className="section-heading"><div><p className="eyebrow">YOUR SPACE</p><h2>What's on your mind?</h2></div><span className="section-note">Keep it simple. Expect follow-up.</span></div>
        <form className="task-form" onSubmit={addTask}><label htmlFor="taskTitle" className="input-label">TASK DESCRIPTION</label><input id="taskTitle" name="title" placeholder="Write something you want to get done..." maxLength="120" required disabled={!!popup || !!currentOverdue} /><div className="form-bottom"><div className="field"><label htmlFor="taskDeadline">DECLARED DUE DATE</label><input id="taskDeadline" name="deadline" type="datetime-local" defaultValue={localDateTime()} required disabled={!!popup || !!currentOverdue} /></div><div className="field"><label htmlFor="taskPriority">REVIEW LEVEL</label><select id="taskPriority" name="priority" defaultValue="NORMAL" disabled={!!popup || !!currentOverdue}><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option></select></div><button type="submit" className="button button-primary add-button" disabled={!!popup || !!currentOverdue}>File task ↗</button></div></form>
      </section>
      <section className="task-section"><div className="section-heading"><div><p className="eyebrow">THE LIST</p><h2>Your tasks</h2></div><label className="filter-label">SHOW <select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Everything</option><option value="open">To do</option><option value="done">Completed</option></select></label></div>
        <div className="task-list">{displayedTasks.map(task => { const overdue = isOverdue(task); const even = task.number % 2 === 0; return <article className={`task-card ${task.completed ? 'completed' : ''}`} key={task.id}><button type="button" className="task-number" aria-label={`Task ${task.number}`} onClick={() => { if (even && !task.completed) completeTask(task); else setNotice({ title: 'TASK INDEX', message: `Entry ${String(task.number).padStart(2, '0')}.`, detail: 'All records are indexed sequentially.' }); }}>{String(task.number).padStart(2, '0')}</button><div className="task-content"><h3 className="task-title">{task.title}</h3><div className="task-meta"><span className={`deadline ${overdue ? 'late' : ''}`}>{overdue ? 'OVERDUE · ' : 'DUE · '}{formatDate(task.deadline)}</span><span className="priority">{task.priority}</span>{task.completed && <span>COMPLETED ✓</span>}</div></div><div className="task-actions"><button type="button" className="complete-btn" onClick={() => completeTask(task)} disabled={task.completed || !!popup || !!currentOverdue}>{task.completed ? 'COMPLETED ✓' : 'DECLARE COMPLETE'}</button><button type="button" className="delete-btn" aria-label="Remove task" onClick={() => removeTask(task)} disabled={!!popup}>×</button></div></article>; })}</div>
        {!displayedTasks.length && <div className="empty-state"><span className="empty-art">✳</span><h3>Nothing on the list just yet.</h3><p>Enjoy the breathing room, or add a task above.</p></div>}
      </section>
      <section className="history-panel" id="history"><div><p className="eyebrow">YOUR LONG GAME</p><h2>Progress that stays.</h2><p>Your lifetime achievements stay with you. Removing a task from your list won't erase the progress you've made.</p></div><div className="lifetime-stat"><strong>{String(stats.lifetimeCompleted).padStart(2, '0')}</strong><span>TASKS COMPLETED<br />IN TOTAL</span></div></section>
      <footer><span>JOT_ · MADE FOR YOUR EVERYDAY</span><span>SAVED ON THIS DEVICE · <button type="button" className="footer-link" onClick={resetData}>Reset demo data</button></span></footer>
    </main>
    {popup && <PopupWindow popup={popup} onClose={closePopup} onMinimize={() => setPopup({ ...popup, minimized: true })} onRestore={() => setPopup({ ...popup, minimized: false })} />}
    {currentOverdue && <TypingGate key={currentOverdue.id} task={currentOverdue} onAccepted={acceptTyping} />}
    {notice && <div className="toast" role="status"><strong>{notice.title}</strong><span>{notice.message}</span><button onClick={deleteNotice} aria-label="Dismiss">×</button></div>}
  </div>;
}

export default App;
