# 🎓 EduNotes – Gestion des Notes Scolaires (Microservices)

A microservices-based school grade management system built with Node.js, MongoDB, RabbitMQ, and Docker.

---

## 📐 Architecture

```
Client
  ├── auth-service      :3001  →  Login / Register / JWT
  ├── user-service      :3002  →  Account management (Admin)
  ├── notes-service     :3003  →  Grades CRUD + Bulletin
  └── notification-svc  :3004  →  Async RabbitMQ consumer
```

### Roles
| Role | Permissions |
|---|---|
| **admin** | Manage all accounts, delete grades |
| **formateur** | Add/update grades, view trainees |
| **stagiaire** | View own grades & transcript only |

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop running
- (Optional) Postman for API testing

### 1. Clone & configure
```bash
cp .env.example .env
# Edit .env if you want to change JWT_SECRET
```

### 2. Start all services
```bash
docker-compose up --build
```

All 6 containers will start:
- `edunotes-rabbitmq`   → RabbitMQ (AMQP :5672, Management UI :15672)
- `edunotes-mongo-auth`, `edunotes-mongo-users`, `edunotes-mongo-notes`
- `edunotes-auth`, `edunotes-users`, `edunotes-notes`, `edunotes-notifications`

### 3. Seed an Admin account

```bash
# POST http://localhost:3001/auth/register
{
  "name": "Super Admin",
  "email": "admin@edunotes.com",
  "password": "Admin1234!",
  "role": "admin"
}
```

---

## 📡 API Endpoints

### Auth Service (`:3001`)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a user |
| POST | `/auth/login` | Public | Login & get JWT |
| GET | `/auth/me` | Any authenticated | Get own profile |

### User Service (`:3002`)
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/users` | Admin, Formateur | List all users |
| GET | `/users/:id` | Admin, Formateur | Get user by ID |
| POST | `/users` | Admin | Create user |
| PUT | `/users/:id` | Admin | Update user |
| DELETE | `/users/:id` | Admin | Delete user |

### Notes Service (`:3003`)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/notes` | Formateur | Add a grade |
| GET | `/notes/stagiaire/:id` | Auth (own for stagiaire) | Get grades |
| GET | `/notes/bulletin/:id` | Auth (own for stagiaire) | Full transcript |
| PUT | `/notes/:id` | Formateur | Update grade |
| DELETE | `/notes/:id` | Admin | Delete grade |

---

## 🔑 Authentication

All protected routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🐰 RabbitMQ

- Management UI: http://localhost:15672 (guest / guest)
- When a grade is added via `POST /notes`, the notes-service publishes a `note.added` event
- The notification-service consumes it and logs a notification

---

## 🧪 Postman Testing

Import `EduNotes.postman_collection.json` into Postman.

**Test flow:**
1. `Admin Login` → copy token
2. `Admin – Create Formateur` (use token)
3. `Admin – Create Stagiaire`
4. `Formateur Login` → copy token
5. `Formateur – Add Note` (triggers RabbitMQ notification)
6. `Stagiaire Login` → copy token
7. `Stagiaire – View Own Notes`
8. `Stagiaire – Try Add Note` → expect **403 Forbidden**

---

## 📁 Project Structure

```
edunotes/
├── docker-compose.yml
├── .env.example
├── README.md
├── EduNotes.postman_collection.json
├── auth-service/
├── user-service/
├── notes-service/
└── notification-service/
```
