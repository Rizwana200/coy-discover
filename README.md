# 💘 Coy Discover

> A profile discovery application built with **React**, **Vite**, **Node.js**, **Express**, and **Supabase PostgreSQL**.
> Discover profiles, ❤️ like or ❌ pass, view matches, revisit skipped profiles, and manage your swipe history.

🌐 **Live Demo:** [Visit Coy Discover](https://coy-discover-lsak.onrender.com)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

---

## 📌 1. Project Overview

**Coy Discover** is a standalone profile discovery application developed as part of a development assignment.

The application provides a **card-based discovery interface** where visitors can interact with profiles and view their previous actions.

Each browser visitor receives a **unique visitor ID**. Their likes and passes are stored separately in a **Supabase PostgreSQL** database.

---

## 🛠️ 2. Technologies Used

### 🎨 Frontend
-  **React**
-  **Vite**
-  JavaScript
-  CSS
-  Lucide React Icons

### 🖥️ Backend
-  **Node.js**
-  **Express.js**
-  JavaScript
-  PostgreSQL driver (`pg`)
-  CORS

### 🗄️ Database
-  **Supabase PostgreSQL**
-  SQL
-  **Row Level Security (RLS)**

### 🚀 Deployment
- 🐙 GitHub
- ☁️ Render (planned deployment)

---

## ✨ 3. Features

### 🔍 Discover
- Displays available profiles.
- Supports profile discovery through an interactive card interface.
- Allows visitors to like or pass on profiles.
- Automatically removes previously swiped profiles from the Discover feed.

### ❤️ Likes and Passes
- Visitors can like profiles.
- Visitors can pass on profiles.
- Swipe actions are stored in the **Supabase** database.
- Duplicate swipe actions for the same visitor and profile are prevented.

### 💞 Matches
- Displays profiles that the visitor liked and that have `likesMe` set to true.
- Shows matching profile information.

### ⏭️ Skipped Profiles
- Displays previously passed profiles.
- Allows visitors to revisit skipped profiles.

### ↩️ Undo Pass
- Removes a previous pass.
- Returns that profile to the Discover feed.

### 🔄 Change Pass to Like
- Allows visitors to change a previous pass into a like.
- Checks whether the profile qualifies as a match.

### 🧑‍💻 Visitor-Specific Data
- Generates a unique visitor ID in the browser.
- Stores the visitor ID in `localStorage`.
- Keeps each visitor's swipe history separate.
- Preserves swipe history across browser refreshes and visits using the same browser storage.

---

## ⚡ 4. Performance & Design Highlights

| 🚀 Area | ✅ How it is handled |
|---|---|
| **Fast frontend builds** | **Vite** provides instant dev-server start and quick hot reloads. |
| **Fast lookups** | An **index on `visitor_id`** keeps each visitor's swipe queries quick as data grows. |
| **No duplicate data** | A **unique constraint** on `visitor_id` + `profile_id` is enforced by **Supabase PostgreSQL** itself, not just the UI. |
| **Data integrity** | A `CHECK` constraint restricts `direction` to `like` or `pass`. |
| **Lightweight identity** | The visitor ID lives in `localStorage`, so no login or auth round trip is needed. |
| **Persistent history** | Swipes are saved in **Supabase PostgreSQL**, so history survives refreshes and server restarts. |
| **Security** | **Row Level Security (RLS)** is enabled, and credentials stay in environment variables. |

---

## 📁 5. Project Structure

```text
coy-discover/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── animations.css
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── data/
│   │   └── state.json
│   ├── profiles.json
│   ├── profiles_raw.json
│   ├── generateProfiles.js
│   ├── server.js
│   └── package.json
│
├── README.md
└── package.json
```

> 📝 **Note:** `state.json` was used for the earlier local JSON-based storage implementation. Swipe history is now stored in **Supabase PostgreSQL**.

---

## 🗄️ 6. Database Design (Supabase PostgreSQL)

The application uses **Supabase PostgreSQL** to persist visitor swipe history.

### 📋 Table: `public.swipes`

| Column | Data Type | Description |
|---|---|---|
| `id` | bigint | Unique record ID |
| `visitor_id` | text | Identifies the browser visitor |
| `profile_id` | text | Identifies the interacted profile |
| `direction` | text | Like or pass |
| `created_at` | timestamptz | Date and time of the action |

### 🔐 Database Constraints
- 🔑 Primary key on `id`.
- 🚫 Unique combination of `visitor_id` and `profile_id`.
- ✅ Direction restricted to `like` or `pass`.
- ⚡ Index on `visitor_id`.
- 🔒 Row Level Security enabled.

### 🧾 SQL Schema

```sql
CREATE TABLE public.swipes (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    visitor_id text NOT NULL,
    profile_id text NOT NULL,
    direction text NOT NULL
        CHECK (direction IN ('like', 'pass')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (visitor_id, profile_id)
);

CREATE INDEX swipes_visitor_id_idx
ON public.swipes(visitor_id);

ALTER TABLE public.swipes
ENABLE ROW LEVEL SECURITY;
```

The backend connects to PostgreSQL using the `pg` package.

---

## 🔌 7. Backend API Endpoints

Base URL during local development:

```text
http://localhost:5000
```

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | 💚 Backend health check |
| `GET` | `/feed` | 🔍 Retrieves profiles not yet swiped |
| `POST` | `/swipe` | ❤️ Saves a like or pass |
| `GET` | `/matches` | 💞 Retrieves matching profiles |
| `GET` | `/skipped` | ⏭️ Retrieves passed profiles |
| `POST` | `/undo-pass` | ↩️ Removes a previous pass |
| `POST` | `/change-to-like` | 🔄 Changes a pass into a like |

### 🪪 Visitor Identification

All API requests except the health check require the following HTTP header:

```text
x-user-id: visitor-unique-id
```

The frontend generates and stores this ID in browser `localStorage`.

### 📨 Example Swipe Request

```json
{
  "profileId": "p1",
  "direction": "like"
}
```

Allowed directions:
- `like`
- `pass`

---

## 💻 8. Local Installation and Setup

### ✅ Prerequisites
- Node.js
- npm
- Git
- **Supabase** account

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Rizwana200/coy-discover.git
cd coy-discover
```

### 2️⃣ Install Backend Dependencies

```bash
cd server
npm install
```

### 3️⃣ Configure Database Connection

Set the **Supabase PostgreSQL** connection string as an environment variable.

Variable name:

```text
DATABASE_URL
```

Example format:

```text
postgresql://username:password@host:5432/postgres
```

> ⚠️ **Do not commit database credentials to GitHub.**

For Git Bash, set the variable temporarily:

```bash
export DATABASE_URL='YOUR_SUPABASE_CONNECTION_STRING'
```

### 4️⃣ Start Backend

```bash
npm start
```

Backend runs at:

```text
http://localhost:5000
```

### 5️⃣ Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

### 6️⃣ Start Frontend

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## 🔧 9. Environment Variables

### 🖥️ Backend

| Variable | Description |
|---|---|
| `DATABASE_URL` | **Supabase** PostgreSQL connection string |
| `PORT` | Backend port; supplied by Render during deployment |

### 🎨 Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Deployed backend URL |

For local development, the frontend uses `http://localhost:5000` as its default API URL.

---

## ☁️ 10. Deployment Plan

The application is intended to be deployed using **Render**.

### 🖥️ Backend Deployment
- Service type: **Web Service**
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`

Environment variable:

```text
DATABASE_URL=YOUR_SUPABASE_CONNECTION_STRING
```

### 🎨 Frontend Deployment
- Service type: **Static Site**
- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist`

Environment variable:

```text
VITE_API_URL=YOUR_DEPLOYED_BACKEND_URL
```

---

## 📝 11. Important Notes

-  The application currently uses sample profile data stored in `profiles.json`.
-  Visitor IDs are browser-generated identifiers, not authenticated user accounts.
-  Clearing browser `localStorage` or using another browser creates a new visitor identity.
-  Match results use the predefined `likesMe` field in the sample profile data.
-  **Supabase** stores visitor swipe history, while profile information is loaded from the backend JSON file.
-  The database connection string must remain private.
-  Row Level Security is enabled on the database table. The backend uses its PostgreSQL connection to access the table.

---

## 👩‍💻 12. Author

**P Rizwana**

🐙 GitHub: https://github.com/Rizwana200

📦 Project: Coy Discover
