# Topset, a workout logging app

I created a workout logging app that breaks off from the standard number-crunching app. Instead, I focused on creating a more encouraging and humanizing approach to lifting by focusing on an avatar that grows with the user's progress. It has different mood settings that is determined by how often and how much the user is training. I aimed to make this app a low-stakes environment where the user isn't swamped by numbers on the UI, but is met with a friendly avatar coach that analyzes user progression, plateaus, prs, and deload trends and provides dynamic and constructive criticism.

Much of the algorithm is hidden behind the UI, leaving only the highlights, coaching tips, and avatar emotions for the user to see.

1. Highlights are chosen for the day and week to make the user proud of his or her achievements.
2. Coaching tips are unique for each and every set the user does, and I will be looking into expanding into ML-supported advice.
3. The avatar's emotions change based on the volume and intensity of the user's baseline training for the past 14 days.

---

## Tech stack
- React + TypeScript
- Vite
- Tailwind CSS
- Custom React hooks for state management

## Backend
- Node.js + Express
- MySQL database
- Prisma ORM
- REST API

## Core Features
- React + TypeScript frontend (Vite) with Tailwind UI
- Multi-page layout: Home, Log Workout, Calendar, Stats, Profile
- Exercise library with dynamic set logging (weight + reps)
- Draft workout state with daily reset and local-first persistence
- Node.js backend with Prisma ORM and REST API (GET / POST workouts)

## Behavioral & Algorithmic Highlights
- Avatar-driven UX that reacts to user consistency and workout completion
- Lightweight state algorithms to track streaks, missed days, and effort signals
- Contextual encouragement and tips generated from recent workout patterns
- Designed to reinforce habit-building without aggressive gamification

---

## Setup (Local Demo)

Running the full application locally requires Node.js, MySQL, and npm. The app consists of a React frontend, a Node.js backend, and a MySQL database.

### Requirements

- Node.js 18 or newer (Node 20 LTS recommended)
- npm (included with Node.js)
- MySQL 8 or newer
- Git (optional)

You can verify installations using `node -v`, `npm -v`, and `mysql --version`.

---

### Database

MySQL must be running locally.  
A database named `lifting` is required, along with a user that has permission to create and alter tables.

Example SQL configuration:

`CREATE DATABASE lifting;`  
`CREATE USER 'lifting_app'@'localhost' IDENTIFIED BY 'your_password';`  
`GRANT ALL PRIVILEGES ON lifting.* TO 'lifting_app'@'localhost';`  
`FLUSH PRIVILEGES;`

---

### Backend Configuration

The backend requires a `.env` file located in the `backend/` directory.

Example contents:

`DATABASE_URL="mysql://lifting_app:your_password@localhost:3306/lifting"`  
`PORT=3001`

Backend dependencies are installed using `npm install`.

Prisma client generation and database migrations are run with  
`npx prisma generate` and `npx prisma migrate dev`.

The backend server is started using `npm run dev` and runs on `http://localhost:3001`.

---

### Frontend Configuration

Frontend dependencies are installed from the `frontend/` directory using `npm install`.

The frontend development server is started using `npm run dev` and runs on `http://localhost:5173`.

Once both frontend and backend are running, the application can be accessed by opening `http://localhost:5173` in a browser.

---

## Application Overview

Topset is designed to be a low-stakes, encouraging environment for lifting.  
Rather than focusing on optimization or competition, the app emphasizes consistency, intent, and long-term habit formation.

All coaching output is deterministic. Given the same workout data and history, the same feedback is always produced.

---

## Navigation

### Home
Displays the current coaching state, avatar feedback, and recent highlights.  
Acts as the primary overview of progress and momentum.

### Log Workout
The main interaction surface for the app.  
Users select exercises, log sets (weight and reps), and receive contextual coaching feedback.  
Draft-safe logging ensures workouts are not lost if the page is refreshed or closed.

### Calendar
Provides a visual overview of training days.  
Used internally by the coaching engine to evaluate consistency, streaks, and gaps.

### Stats
Displays aggregated performance insights.  
All calculations are unit-aware (kg / lb) and emphasize trends rather than raw tables.

### Profile
Allows configuration of units, experience level, and goals.  
Includes data export and reset functionality.

---

## Core Features

### Workout Logging
- Exercise-based workout structure
- Multiple sets per exercise
- Draft-safe logging with automatic daily reset
- Local-first persistence for reliability

### Exercise Library
- Predefined compound and accessory lifts
- Consistent naming enables clean statistics and reliable coaching logic
- Designed for future custom exercise support

### Avatar-Driven Coaching
- A persistent virtual coach accompanies the user across pages
- Avatar emotion is computed from training consistency, workload, and fatigue
- Emotional state influences tone, highlights, and feedback intensity

### Deterministic Coaching Engine
- Rule-based and fully deterministic
- Analyzes current workout drafts and a rolling 14-day training baseline
- Adapts feedback based on relative intensity, volume, and frequency trends

### Contextual Coaching Tips
- Every logged set receives context-aware feedback
- Tips adapt based on lift category, rep range, relative intensity, and fatigue state
- Emphasis shifts between technique, control, and restraint as needed

### Highlight System
- Surfaces a small number of meaningful wins
- Includes relative heavy sets, rep PRs, consistency wins, and volume milestones
- Avoids noisy or ego-driven metrics

### Stats Without Overload
- Focuses on high-signal metrics only
- Unit-aware across the entire app
- Avoids spreadsheet-style UI

---

## Design Principles

- Habit-first, not ego-first
- Deterministic logic over randomness
- High signal, low noise UI
- Encouragement without aggressive gamification
- Coaching adapts to the user, not global standards

---

## Notes

This setup reflects a development and demo environment.  
The frontend can load without the backend, but persistence and statistics require the backend and database.  
All coaching logic is computed client-side from logged workout data.

---

## Future Extensions

- Account-based cloud sync
- Machine-learning assisted coaching refinement
- Progressive overload recommendations
- Personalized fatigue modeling
- Optional social and competitive features

