# JavaScript Frameworks (U21CSP12) - Assignment II

| Question | Folder | Stack |
|---|---|---|
| Q1 (8) Student Management System | `q1-student-management` | MERN |
| Q2 Task 1 (16) Online Bookstore | `q2-task1-bookstore` | MERN |
| Q2 Task 2 (16) Student Task Manager | `q2-task2-task-manager` | MERN |
| Q3 Task 1 (16) Course Registration | `q3-task1-course-registration` | MEAN (Angular) |
| Q3 Task 2 (16) Appointment Booking | `q3-task2-appointment-booking` | MEAN (Angular) |

Q2 and Q3 are "OR" questions, so you only need to submit one task from each. All five are included.

## Prerequisites
- Node.js 18+
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or set `MONGO_URI` in `server/.env`)

## Running a project
Every project has a `server/` and a `client/` folder. Open two terminals.

```bash
# Terminal 1 - API (http://localhost:5000)
cd <project>/server
npm install
cp .env.example .env      # optional, defaults work for local MongoDB
npm start

# Terminal 2 - frontend
cd <project>/client
npm install
npm run dev               # React (Vite) -> http://localhost:5173
npm start                 # Angular      -> http://localhost:4200
```

Run only one project's server at a time (they all use port 5000), or change `PORT` in `server/.env`
(for the React apps also update the proxy in `client/vite.config.js`; for the Angular apps, the `API` constant in the service file).

## What each project covers
- **Q1**: React form (add/update), Express REST API (`/api/students`), MongoDB via Mongoose, add / view / update / delete.
- **Q2-T1**: React components for books, MongoDB fields title/author/price/availability, REST CRUD, search by title or author (`GET /api/books?search=`).
- **Q2-T2**: Add / edit / delete tasks, priority and completion status, React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`), Node backend + MongoDB.
- **Q3-T1**: Angular course list, register / cancel (seat limits enforced by the API), course and student data in MongoDB, Angular reactive-form validation.
- **Q3-T2**: Angular patient registration form, doctors with free slots, REST appointment APIs (atomic slot booking, cancel frees the slot), patients and appointments in MongoDB.

Sample books, courses and doctors are seeded automatically the first time a server starts on an empty database.
