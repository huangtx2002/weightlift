# Docker Setup Guide for Topset

This guide explains how to run the entire Topset application stack using Docker and Docker Compose.

## Prerequisites

- **Docker** (version 20.10 or newer)
- **Docker Compose** (version 2.0 or newer)

Verify your installations:
```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone and Navigate
```bash
cd /path/to/weightlift
```

### 2. Build and Start All Services
```bash
docker-compose up --build
```

This single command will:
- Start MySQL database
- Build and run the backend API
- Build and run the frontend
- Automatically run Prisma migrations

### 3. Access the Application

- **Frontend**: http://localhost:5273
- **Backend API**: http://localhost:8002
- **Health Check**: http://localhost:8002/health

### 4. Stop All Services
```bash
docker-compose down
```

## Docker Architecture

### Services

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| `db` | weightlift-db | 3406 | MySQL 8.0 database |
| `backend` | weightlift-backend | 8002 | Node.js + Express API |
| `frontend` | weightlift-frontend | 5273→80 | React app served by nginx |

### Data Persistence

MySQL data is stored in a Docker volume named `mysql_data`. This persists even when containers are stopped.

To completely reset the database:
```bash
docker-compose down -v
docker-compose up --build
```

## Common Commands

### Start in Detached Mode (Background)
```bash
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Rebuild a Specific Service
```bash
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Stop Services
```bash
docker-compose stop
```

### Restart Services
```bash
docker-compose restart
```

### Remove Containers (keeps data)
```bash
docker-compose down
```

### Remove Containers AND Data
```bash
docker-compose down -v
```

## Development Workflow

### Hot Reload (Development Mode)

For active development with hot reload:

1. **Option A**: Run only database in Docker, dev servers locally
```bash
# Start just the database
docker-compose up db

# In separate terminals:
cd backend && npm run dev
cd frontend && npm run dev
```

2. **Option B**: Modify docker-compose.yml to mount volumes
```yaml
# Uncomment the volumes section in docker-compose.yml
# This allows code changes to reflect immediately
```

### Viewing Database Contents

Connect to MySQL using any MySQL client:
```bash
# Using Docker exec
docker exec -it weightlift-db mysql -u lifting_app -plifting_password lifting

# Or use external tools with:
Host: localhost
Port: 3406
User: lifting_app
Password: lifting_password
Database: lifting
```

### Running Prisma Commands

```bash
# Generate Prisma Client
docker-compose exec backend npx prisma generate

# Run migrations
docker-compose exec backend npx prisma migrate dev

# Open Prisma Studio
docker-compose exec backend npx prisma studio
```

## Environment Variables

### Backend (.env)

Create `backend/.env` (use `backend/.env.example` as template):
```env
DATABASE_URL="mysql://lifting_app:lifting_password@db:3306/lifting"
PORT=8002
NODE_ENV=production
```

**Important**: Use `db` as the hostname (Docker service name), not `localhost`.

### Root (.env)

Optional root `.env` file for docker-compose overrides:
```env
MYSQL_ROOT_PASSWORD=your_custom_password
MYSQL_DATABASE=lifting
MYSQL_USER=lifting_app
MYSQL_PASSWORD=your_custom_password
```

## Troubleshooting

### Port Already in Use

If ports 3406, 8002, or 5273 are already in use:

```yaml
# Edit docker-compose.yml
ports:
  - "3407:3306"  # Use 3407 instead of 3406
  - "8003:8002"  # Use 8003 instead of 8002
  - "5274:80"    # Use 5274 instead of 5273
```

### Database Connection Issues

1. Check if database is healthy:
```bash
docker-compose ps
```

2. View database logs:
```bash
docker-compose logs db
```

3. Restart with clean database:
```bash
docker-compose down -v
docker-compose up --build
```

### Backend Not Starting

1. Check backend logs:
```bash
docker-compose logs backend
```

2. Ensure DATABASE_URL uses `db` as hostname
3. Rebuild backend:
```bash
docker-compose up -d --build backend
```

### Frontend Not Loading

1. Check nginx logs:
```bash
docker-compose logs frontend
```

2. Verify backend is running:
```bash
curl http://localhost:8002/health
```

3. Rebuild frontend:
```bash
docker-compose up -d --build frontend
```

### Prisma Migration Errors

If migrations fail on startup:

```bash
# Enter backend container
docker-compose exec backend sh

# Reset database
npx prisma migrate reset --force

# Exit and restart
exit
docker-compose restart backend
```

## Production Deployment

For production deployment:

1. **Update docker-compose.yml**:
   - Remove volume mounts
   - Set `NODE_ENV=production`
   - Use strong passwords
   - Add resource limits

2. **Use environment-specific configs**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Add reverse proxy** (nginx/Traefik) for SSL termination

4. **Use secrets management** instead of plain text passwords

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

## Getting Help

If you encounter issues:

1. Check container status: `docker-compose ps`
2. View logs: `docker-compose logs -f`
3. Verify network: `docker network inspect weightlift_default`
4. Test database connection: `docker-compose exec db mysqladmin ping -h localhost -u root -prootpassword`
