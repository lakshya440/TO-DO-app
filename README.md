# Tasks — MERN to-do app

React (Vite) + Express + MongoDB (Mongoose), with light/dark mode.

## 1. Backend
```bash
cd server
npm install
cp .env.example .env     # edit MONGO_URI if needed
npm run dev              # http://localhost:5001
```
Needs MongoDB running locally (`mongodb://127.0.0.1:27017/todo-app`) or a MongoDB Atlas connection string in `.env`.

## 2. Frontend
```bash
cd client
npm install
npm run dev              # http://localhost:5173
```
Vite proxies `/api` to the Express server, so no extra config is needed.

## API
| Method | Route | Purpose |
|---|---|---|
| GET | /api/todos | list tasks |
| POST | /api/todos | create `{ title }` |
| PATCH | /api/todos/:id | update `{ title?, completed? }` |
| DELETE | /api/todos/:id | delete one |
| DELETE | /api/todos | delete all completed |
