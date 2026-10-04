const BASE = '/api/todos';

async function request(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
  return res.json();
}

export const getTodos = () => request(BASE);
export const addTodo = (title) => request(BASE, { method: 'POST', body: JSON.stringify({ title }) });
export const updateTodo = (id, data) => request(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteTodo = (id) => request(`${BASE}/${id}`, { method: 'DELETE' });
export const clearCompleted = () => request(BASE, { method: 'DELETE' });
