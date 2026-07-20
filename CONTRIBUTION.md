# Contributing to LedgerLoop

Welcome to LedgerLoop! This guide will help you get the project up and running on your local machine. Whether you're a developer, contributor, or just curious, follow these steps to set up your development environment.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **pnpm** (v11.10.0 or higher) - Install globally: `npm install -g pnpm`
- **Docker & Docker Compose** - [Install here](https://docs.docker.com/get-docker/)
- **Git** - [Download here](https://git-scm.com/)
- **PostgreSQL Client** (optional, for direct database access) - [Download here](https://www.postgresql.org/download/)

### Verify Installations

```bash
node --version      # Should be v18+
pnpm --version      # Should be v11.10.0+
docker --version
docker compose --version
git --version
```

---

## Project Structure

```
ledger-loop/
├── client/              # Next.js frontend (React 19)
│   ├── src/
│   │   ├── app/        # App routing
│   │   ├── components/ # React components
│   │   ├── context/    # Context API for state
│   │   └── lib/        # Utilities (axios, constants)
│   └── package.json
├── server/              # Express.js backend (Node.js)
│   ├── src/
│   │   ├── app.ts      # Express app configuration
│   │   ├── server.ts   # Server entry point
│   │   ├── controllers/# Route handlers
│   │   ├── services/   # Business logic
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Custom middleware
│   │   ├── schemas/    # Zod validation schemas
│   │   └── utils/      # Helpers (Prisma, error handling)
│   ├── prisma/         # Database schema & migrations
│   ├── docker-compose.yml
│   └── package.json
└── README.md
```

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/KingsCreatives/ledger-loop.git
cd ledger-loop
```

---

## Step 2: Set Up Docker Services

The project uses **Docker Compose** to run PostgreSQL and Redis. These services are essential for the application to work.

### Step 2.1: Grant Docker Permissions

If you're on Linux/Mac and get a permission error, add your user to the docker group:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Verify Docker is accessible:

```bash
docker ps
```

### Step 2.2: Start Docker Services

Navigate to the server directory and start the services:

```bash
cd server
docker compose up -d
```

This will start:

- **PostgreSQL** on port `5435` (pgweb UI on port `8085`)
- **Redis** on port `6379` (redis-commander UI on port `8081`)

Verify services are running:

```bash
docker compose ps
```

You should see:

```
NAME                COMMAND                  SERVICE             STATUS
postgres            "docker-entrypoint.s…"   postgres            Up
redis               "redis-server --save…"   redis               Up
pgweb               "pgweb"                  pgweb               Up
redis-commander     "npm start"              redis-commander     Up
```

---

## Step 3: Configure Environment Variables

### Step 3.1: Create `.env` in the Server Directory

Navigate to `server/` and create a `.env` file with the following variables:

```bash
cd /home/imking/projects/ledger-loop/server
```

Create `.env`:

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://postgres:password123@localhost:5435/ledger_loop

# Server Configuration
PORT=5000
NODE_ENV=development

# Session Secret (generate a strong one)
SESSION_SECRET=your_secure_random_string_here_min_32_chars

# Docker Compose Environment Variables
DB_NAME=ledger_loop
DB_USER=postgres
DB_PASSWORD=password123

# Redis UI Credentials (for redis-commander on port 8081)
REDIS_UI_USER=admin
REDIS_UI_PASSWORD=admin123
```

**Generate a secure SESSION_SECRET:**

```bash
openssl rand -base64 32
```

### Step 3.2: Create `.env.local` in the Client Directory

Navigate to `client/` and create a `.env.local` file:

```bash
cd /home/imking/projects/ledger-loop/client
```

Create `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

This variable tells the frontend where to reach the backend API.

### Step 3.3: Verify Database Connection

Test the connection from the `server/` directory:

```bash
pnpm exec prisma db push
```

---

## Step 4: Install Dependencies

### Step 4.1: Install Server Dependencies

```bash
cd server
pnpm install
```

### Step 4.2: Install Client Dependencies

```bash
cd ../client
pnpm install
```

---

## Step 5: Set Up the Database

### Step 5.1: Run Database Migrations

From the `server` directory:

```bash
cd server
pnpm exec prisma migrate deploy
```

### Step 5.2: Seed the Database (Optional)

Populate the database with initial test data:

```bash
pnpm exec prisma db seed
```

This creates:

- A test user account with email `finance_admin_*@example.com` and password `password123`
- Sample accounts (Operating Cash, Owner's Equity)
- Initial journal entries

### Step 5.3: View Database (Optional)

Open **Prisma Studio** to browse and manage data:

```bash
pnpm exec prisma studio
```

This opens an admin UI at `http://localhost:5555`

---

## Step 6: Start the Development Servers

### Step 6.1: Start the Backend Server

From the `server` directory:

```bash
cd server
pnpm dev
```

You should see:

```
Server is listening PORT:5000
```

The API is now available at `http://localhost:5000`

### Step 6.2: Start the Frontend Server (in a new terminal)

From the `client` directory:

```bash
cd client
pnpm dev
```

You should see:

```
  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000
```

The frontend is now available at `http://localhost:3000`

---

## Verification Checklist

After completing the setup, verify everything is working:

- [ ] **Backend API**: Visit `http://localhost:5000` (should respond or show API info)
- [ ] **Frontend**: Visit `http://localhost:3000` (should load the homepage)
- [ ] **PostgreSQL**: Visit `http://localhost:8085` (pgweb admin UI)
- [ ] **Redis Commander**: Visit `http://localhost:8081` (Redis UI)
- [ ] **Prisma Studio**: Run `pnpm exec prisma studio` from `server/` directory

---

## API Endpoints

The backend provides the following endpoints (prefix: `/api/v1`):

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

### Accounts

- `GET /ledger/accounts` - List all accounts for the user
- `POST /ledger/accounts` - Create a new account
- `GET /ledger/accounts/:accountId` - Get account details

### Imports

- `POST /import/upload` - Upload CSV/JSON import file
- `GET /import/batches` - List import batches

### Ledger

- `GET /ledger/entries` - List journal entries
- `POST /ledger/entries` - Create journal entry

---

## Common Commands

### Backend (from `server/` directory)

```bash
# Development server with hot-reload
pnpm dev

# Run database migrations
pnpm exec prisma migrate dev --name "migration_name"

# Reset database (development only)
pnpm exec prisma migrate reset

# Open Prisma Studio
pnpm exec prisma studio

# Check migration status
pnpm exec prisma migrate status
```

### Frontend (from `client/` directory)

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

### Docker (from `server/` directory)

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View service logs
docker compose logs -f

# View specific service logs
docker compose logs -f postgres
docker compose logs -f redis
```

---

## Troubleshooting

### Issue: Docker permission denied

**Solution**: Add your user to the docker group and apply changes:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Issue: Port already in use

**Solution**: Change the port in `.env` (backend) or `next.config.ts` (frontend), or kill the process using the port:

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: `DATABASE_URL` connection error

**Solution**: Verify Docker services are running:

```bash
docker compose ps
```

Ensure your `.env` has the correct credentials matching `docker-compose.yml`:

- Host: `localhost` (not `postgres`)
- Port: `5435` (not `5432`)
- User: `postgres`
- Password: matches `DB_PASSWORD` in `.env`

### Issue: Prisma Client not generated

**Solution**: Generate Prisma Client manually:

```bash
cd server
pnpm exec prisma generate
```

### Issue: Dependencies not installing

**Solution**: Clear pnpm cache and reinstall:

```bash
pnpm store prune
pnpm install
```

---

## Database Configuration

### PostgreSQL

- **Host**: localhost
- **Port**: 5435
- **Database**: ledger_loop
- **User**: postgres
- **Password**: (set in `.env` as `DB_PASSWORD`)
- **Admin UI**: http://localhost:8085 (pgweb)

### Redis

- **Host**: localhost
- **Port**: 6379
- **Purpose**: Session storage and caching
- **Admin UI**: http://localhost:8081 (redis-commander)

---

## Tech Stack

| Layer              | Technology             | Version | Purpose                           |
| ------------------ | ---------------------- | ------- | --------------------------------- |
| Frontend Framework | Next.js                | 16.1.6  | React framework with routing      |
| Frontend Language  | TypeScript             | 5       | Type-safe frontend code           |
| Frontend UI        | Radix UI + TailwindCSS | Latest  | Component library & styling       |
| Backend Framework  | Express.js             | 5.2.1   | REST API server                   |
| Backend Language   | TypeScript             | 5.9.3   | Type-safe backend code            |
| ORM                | Prisma                 | 7.4.2   | Database abstraction & migrations |
| Database           | PostgreSQL             | Alpine  | Primary data store                |
| Cache/Sessions     | Redis                  | Alpine  | Session storage & caching         |
| Validation         | Zod                    | 4.4.3   | Schema validation                 |
| Dev Tools          | nodemon + tsx          | Latest  | Auto-reload development           |

---

## Contributing Guidelines

1. **Create a feature branch** from `develop`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and test thoroughly

3. **Commit with clear messages**:

   ```bash
   git commit -m "feat: add new feature"
   ```

4. **Push to your branch**:

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** with a detailed description

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/KingsCreatives/ledger-loop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/KingsCreatives/ledger-loop/discussions)
- **Documentation**: See [README.md](./README.md)

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

## Thank You!

Thank you for contributing to LedgerLoop! Your efforts help make financial reconciliation simpler for everyone.
