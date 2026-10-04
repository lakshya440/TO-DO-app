import { useEffect, useMemo, useState } from 'react';
import * as api from './api.js';

const FILTERS = ['All', 'Active', 'Done'];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const SunIcon = <Icon d={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>} />;
const MoonIcon = <Icon d={<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />} />;
const TrashIcon = <Icon size={16} d={<><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></>} />;
const CheckIcon = <Icon size={14} d={<path d="M5 12.5l4.5 4.5L19 7.5" />} />;

function TodoItem({ todo, onToggle, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);

  const save = () => {
    const t = draft.trim();
    setEditing(false);
    if (t && t !== todo.title) onRename(todo._id, t);
    else setDraft(todo.title);
  };

  return (
    <li className={`item ${todo.completed ? 'done' : ''}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="check"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(todo);
        }}
        aria-label={todo.completed ? 'Mark as not done' : 'Mark as done'}
        aria-pressed={todo.completed}
      >
        {CheckIcon}
      </button>

      {editing ? (
        <input
          className="edit"
          autoFocus
          value={draft}
          maxLength={200}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') { setDraft(todo.title); setEditing(false); }
          }}
        />
      ) : (
        <span className="title" onDoubleClick={() => setEditing(true)} title="Double-click to edit">
          {todo.title}
        </span>
      )}

      <button type="button" className="del" onClick={() => onDelete(todo._id)} aria-label={`Delete ${todo.title}`}>
        {TrashIcon}
      </button>
    </li>
  );
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(document.documentElement.dataset.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    api.getTodos()
      .then(setTodos)
      .catch(() => setError('Can’t reach the server. Start the API and refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const run = async (fn) => {
    setError('');
    try {
      return await fn();
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  const add = async (e) => {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    setText('');
    await run(async () => {
      const todo = await api.addTodo(title);
      setTodos((t) => [todo, ...t]);
    });
  };

  const toggle = (todo) => run(async () => {
    const updated = await api.updateTodo(todo._id, { completed: !todo.completed });
    setTodos((t) => t.map((x) => (x._id === updated._id ? updated : x)));
  });

  const rename = (id, title) => run(async () => {
    const updated = await api.updateTodo(id, { title });
    setTodos((t) => t.map((x) => (x._id === id ? updated : x)));
  });

  const remove = (id) => run(async () => {
    await api.deleteTodo(id);
    setTodos((t) => t.filter((x) => x._id !== id));
  });

  const clearDone = () => run(async () => {
    await api.clearCompleted();
    setTodos((t) => t.filter((x) => !x.completed));
  });

  const doneCount = todos.filter((t) => t.completed).length;
  const pct = todos.length ? Math.round((doneCount / todos.length) * 100) : 0;
  const visible = useMemo(
    () => todos.filter((t) => filter === 'All' || (filter === 'Done' ? t.completed : !t.completed)),
    [todos, filter]
  );

  const emptyText = filter === 'Done' ? 'Nothing finished yet.' : filter === 'Active' ? 'All caught up.' : 'No tasks yet. Add your first one above.';

  return (
    <main className="app">
      <header className="top">
        <div>
          <p className="date">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1>{greeting()}</h1>
        </div>
        <button className="theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? SunIcon : MoonIcon}
        </button>
      </header>

      <section className="progress" aria-label="Progress">
        <div className="bar"><span style={{ width: `${pct}%` }} /></div>
        <p>{todos.length ? `${doneCount} of ${todos.length} done` : 'Nothing planned yet'}</p>
      </section>

      <form className="add" onSubmit={add}>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={200}
          placeholder="What needs doing?" aria-label="New task" />
        <button type="submit" disabled={!text.trim()}>Add task</button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="filters" role="tablist">
        {FILTERS.map((f) => (
          <button type="button" key={f} role="tab" aria-selected={filter === f}
            className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {loading ? (
        <p className="empty">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="empty">{emptyText}</p>
      ) : (
        <ul className="list">
          {visible.map((t) => (
            <TodoItem key={t._id} todo={t} onToggle={toggle} onDelete={remove} onRename={rename} />
          ))}
        </ul>
      )}

      {doneCount > 0 && (
        <button className="clear" onClick={clearDone}>Clear {doneCount} completed</button>
      )}
    </main>
  );
}
