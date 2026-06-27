# Fashion Girl Monorepo  

A clean full-stack starter for an AI-based e-commerce platform.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- AI Service: Python + FastAPI
- Database: MongoDB (local: mongodb://localhost:27017/)

## Project Structure

```text
fashion-girl/
  frontend/
    index.html
    package.json
    vite.config.js
    src/
      App.jsx
      main.jsx
      styles.css
  backend/
    package.json
    .env.example
    src/
      app.js
      server.js
      config/
        db.js
      models/
        Role.js
        User.js
      seed/
        seedData.js
      routes/
        health.js
  ai-service/
    requirements.txt
    .env.example
    README.md
    app/
      main.py
  .gitignore
  README.md
```

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.10+

## 1) Run Frontend (React on 5173)

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

## 2) Run Backend (Express on 5000)

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

On startup, backend will:

- connect to `mongodb://localhost:27017/`
- use database `fashion_girl`
- create `roles` collection with `admin`, `staff`, `customer`
- create `users` collection with default admin/staff users if not already present

Health route: http://localhost:5000/api/health

Expected response:

```text
Backend running
```

Default seeded users (override in `backend/.env`):

- `admin@fashiongirl.local`
- `staff@fashiongirl.local`

## 3) Run AI Service (FastAPI on 8000)

```bash
cd ai-service
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health route: http://localhost:8000/health

Expected response:

```json
"AI service running"
```

## Production-Ready Next Steps

- Add centralized logging and request IDs
- Add input validation and error handling middleware
- Add Dockerfiles and docker-compose for all services
- Add CI workflow for lint, test, build
- Add environment-specific config management
