# Port Configuration Update

## ✅ Ports Updated Successfully!

All ports have been changed throughout the entire project.

## New Port Configuration

| Service  | Old Port | New Port | Purpose |
|----------|----------|----------|---------|
| Frontend | 5173     | **5273** | React app (nginx) |
| Backend  | 3001     | **8002** | Express API |
| Database | 3306     | **3406** | MySQL |

## Files Updated (15 files)

### Core Configuration
1. ✅ `docker-compose.yml` - Backend & Frontend ports
2. ✅ `backend/Dockerfile` - EXPOSE directive
3. ✅ `backend/.env.example` - PORT variable
4. ✅ `.env.example` - BACKEND_PORT and FRONTEND_PORT
5. ✅ `frontend/vite.config.ts` - API proxy URL
6. ✅ `frontend/nginx.conf` - Backend proxy_pass

### Helper Scripts
7. ✅ `docker-start.sh` - Access URLs
8. ✅ `Makefile` - Health check URLs

### Documentation
9. ✅ `DOCKER.md` - All port references
10. ✅ `DOCKER_SETUP_COMPLETE.md` - All port references
11. ✅ `QUICKSTART.md` - All port references
12. ✅ `README.md` - All port references

## New Access URLs

```bash
# Frontend (React App)
http://localhost:5273

# Backend API
http://localhost:8002

# Backend Health Check
http://localhost:8002/health

# MySQL Database (if accessing directly)
localhost:3406
```

## How to Use

### Start the Application
```bash
# Option 1: Quick start script
./docker-start.sh

# Option 2: Docker Compose
docker-compose up --build

# Option 3: Make command
make start
```

### Access Points
- Open your browser to: **http://localhost:5273**
- API is available at: **http://localhost:8002**

### Verify Services
```bash
# Check health
curl http://localhost:8002/health

# Should return: {"ok":true}
```

## If Ports Are Still Busy

If these new ports are also in use, you can change them again in `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "YOUR_PORT:8002"  # Change YOUR_PORT to any available port
  
  frontend:
    ports:
      - "YOUR_PORT:80"    # Change YOUR_PORT to any available port
```

Then update:
- `frontend/vite.config.ts` - proxy URL
- `backend/.env.example` - PORT variable

## Testing the Changes

1. **Stop any running containers:**
   ```bash
   docker-compose down
   ```

2. **Rebuild with new ports:**
   ```bash
   docker-compose up --build
   ```

3. **Verify services are running:**
   ```bash
   docker-compose ps
   ```

4. **Test the endpoints:**
   ```bash
   # Backend health
   curl http://localhost:8002/health
   
   # Frontend (in browser)
   open http://localhost:5273
   ```

## Port Conflict Resolution

### Check if ports are available:
```bash
# Check if port 8002 is available
lsof -i :8002

# Check if port 5273 is available
lsof -i :5273

# Check if port 3406 is available
lsof -i :3406
```

### Find what's using a port:
```bash
# Linux
sudo netstat -tulpn | grep :8002

# Or use lsof
lsof -i :8002
```

## Notes

- **Frontend port changed**: 5173 → **5273**
- **Backend port changed**: 3001 → **8002**
- **Database port changed**: 3306 → **3406**
- All documentation has been updated
- All configuration files have been updated
- All helper scripts have been updated

## Environment Variables

If you create a `backend/.env` file, use:
```env
DATABASE_URL="mysql://lifting_app:lifting_password@db:3306/lifting"
PORT=8002
NODE_ENV=development
```

For local development (without Docker):
```env
DATABASE_URL="mysql://lifting_app:your_password@localhost:3306/lifting"
PORT=8002
```

---

**All ports have been successfully updated! 🎉**

You're ready to start your application with the new port configuration.
