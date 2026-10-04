require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const Todo = require('./models/Todo');

const app = express();
app.use(cors());
app.use(express.json());

let memoryTodos = [];

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ error: err.message });
  });

app.get('/api/todos', wrap(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json([...memoryTodos].sort((a, b) => b.createdAt - a.createdAt));
  }
  res.json(await Todo.find().sort({ createdAt: -1 }));
}));

app.post('/api/todos', wrap(async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  if (!title || title.length > 200) {
    return res.status(400).json({ error: 'Title is required and must be 200 characters or fewer' });
  }
  if (mongoose.connection.readyState !== 1) {
    const todo = {
      _id: randomUUID(),
      title,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryTodos.push(todo);
    return res.status(201).json(todo);
  }
  res.status(201).json(await Todo.create({ title: req.body.title }));
}));

app.patch('/api/todos/:id', wrap(async (req, res) => {
  const { title, completed } = req.body;
  if (title !== undefined && (typeof title !== 'string' || !title.trim() || title.trim().length > 200)) {
    return res.status(400).json({ error: 'Title must be between 1 and 200 characters' });
  }
  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Completed must be a boolean' });
  }
  const update = {};
  if (title !== undefined) update.title = title.trim();
  if (completed !== undefined) update.completed = completed;
  if (mongoose.connection.readyState !== 1) {
    const todo = memoryTodos.find((item) => item._id === req.params.id);
    if (!todo) return res.status(404).json({ error: 'Task not found' });
    Object.assign(todo, update, { updatedAt: new Date() });
    return res.json(todo);
  }
  const todo = await Todo.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!todo) return res.status(404).json({ error: 'Task not found' });
  res.json(todo);
}));

app.delete('/api/todos', wrap(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    memoryTodos = memoryTodos.filter((todo) => !todo.completed);
    return res.json({ ok: true });
  }
  await Todo.deleteMany({ completed: true });
  res.json({ ok: true });
}));

app.delete('/api/todos/:id', wrap(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const index = memoryTodos.findIndex((item) => item._id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Task not found' });
    memoryTodos.splice(index, 1);
    return res.json({ ok: true });
  }
  const todo = await Todo.findByIdAndDelete(req.params.id);
  if (!todo) return res.status(404).json({ error: 'Task not found' });
  res.json({ ok: true });
}));

const PORT = process.env.PORT || 5001;
const startServer = () => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todo-app')
  .then(() => {
    console.log('MongoDB connected');
    startServer();
  })
  .catch((err) => {
    console.warn(`MongoDB unavailable (${err.message}). Using in-memory storage.`);
    startServer();
  });
