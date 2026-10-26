# InstaLite - Prisma Client + CRUD

An Express.js and Prisma ORM backend performing CRUD (Create, Read, Update, Delete) operations on `User` and `Post` tables using the MVC architecture.

## Tech Stack
- **Node.js** (ES Modules)
- **Express.js**
- **Prisma ORM** (v7) with PostgreSQL & `@prisma/adapter-pg`
- **PostgreSQL**

---

## Architecture

```
src/
├── app.js                  # Express app setup and middleware
├── index.js                # Server entry point (starts server on port 3000)
├── server.js               # Exported server instance
├── db.js                   # Prisma Client singleton with PG adapter
├── controllers/
│   ├── users.controller.js # User request/response handling
│   └── posts.controller.js # Post request/response handling
├── routes/
│   ├── users.routes.js     # User route definitions
│   └── posts.routes.js     # Post route definitions
└── services/
    ├── users.service.js    # User Prisma queries
    └── posts.service.js    # Post Prisma queries
```

---

## API Endpoints

### Health Check
- `GET /health` - Returns `{ "status": "OK" }`

### Users
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/users` | Create a user |
| `GET` | `/users` | List all users |
| `GET` | `/users/:id` | Get single user by id |
| `PATCH` | `/users/:id` | Partial update (fullname, bio, isPrivate) |
| `DELETE` | `/users/:id` | Delete user |

### Posts
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/posts` | Create a post (`imageUrl` required) |
| `GET` | `/posts` | List all posts |
| `GET` | `/posts/:id` | Get single post by id |
| `PATCH` | `/posts/:id` | Partial update (caption, location) |
| `DELETE` | `/posts/:id` | Delete post |

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` and set your `DATABASE_URL`:
   ```bash
   cp .env.example .env
   ```

3. **Generate Prisma Client and Push Schema:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Run tests:**
   ```bash
   npm test
   ```
