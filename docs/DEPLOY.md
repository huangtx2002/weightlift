# Deployment Guide for DigitalOcean

Simple guide to deploy Topset on your DigitalOcean droplet.

## Prerequisites

- DigitalOcean droplet with Docker installed
- SSH access to your droplet
- Git installed on droplet

## Deployment Steps

### 1. SSH into Your Droplet

```bash
ssh root@your-droplet-ip
```

### 2. Clone the Project

```bash
cd ~
git clone <your-repo-url> weightlift
cd weightlift
```

### 3. Run Deployment Script

```bash
./deploy.sh
```

That's it! The script will:
- ✅ Create production Docker Compose configuration
- ✅ Generate secure database credentials
- ✅ Build all containers
- ✅ Start the application
- ✅ Run database migrations

### 4. Access Your App

After deployment completes:

```
Frontend: http://your-droplet-ip:5273
Backend:  http://your-droplet-ip:8002
Health:   http://your-droplet-ip:8002/health
```

## Management Commands

### View Logs
```bash
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f db
```

### Stop Application
```bash
docker compose -f docker-compose.prod.yml down
```

### Restart Application
```bash
docker compose -f docker-compose.prod.yml restart
```

### Rebuild After Code Changes
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Check Status
```bash
docker compose -f docker-compose.prod.yml ps
```

### Database Backup
```bash
docker compose -f docker-compose.prod.yml exec db \
  mysqldump -u lifting_app -p lifting > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
docker compose -f docker-compose.prod.yml exec -T db \
  mysql -u lifting_app -p lifting < backup_20240101.sql
```

## Update Deployment

To update your deployment after making changes:

```bash
cd ~/weightlift
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Firewall Configuration

If you want to restrict access, configure UFW:

```bash
# Allow SSH
ufw allow ssh

# Allow HTTP ports
ufw allow 5273/tcp
ufw allow 8002/tcp

# Enable firewall
ufw enable
```

## Using a Domain Name

If you have a domain pointing to your droplet:

1. Install Nginx:
```bash
apt install nginx
```

2. Create Nginx config:
```bash
cat > /etc/nginx/sites-available/topset << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5273;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

3. Enable site:
```bash
ln -s /etc/nginx/sites-available/topset /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

4. Install SSL with Let's Encrypt:
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

## Troubleshooting

### Containers won't start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check if ports are available
netstat -tulpn | grep -E '5273|8002|3406'
```

### Database connection errors
```bash
# Check database is healthy
docker compose -f docker-compose.prod.yml ps

# Check database logs
docker compose -f docker-compose.prod.yml logs db
```

### Frontend can't reach backend
```bash
# Verify backend is running
curl http://localhost:8002/health

# Check network
docker compose -f docker-compose.prod.yml exec frontend ping backend
```

## Clean Uninstall

To completely remove the application and data:

```bash
cd ~/weightlift
docker compose -f docker-compose.prod.yml down -v
cd ..
rm -rf weightlift
```

## Security Notes

- Database credentials are stored in `.credentials` file
- Database port (3406) is only accessible from localhost
- Keep your `.credentials` file secure
- Consider using a reverse proxy (Nginx) for SSL
- Regularly backup your database

## Performance

For better performance on small droplets:

```bash
# Limit Docker resource usage
# Add to docker-compose.prod.yml under each service:
deploy:
  resources:
    limits:
      memory: 512M
```

## Monitoring

Check resource usage:
```bash
docker stats
```

Check disk usage:
```bash
docker system df
df -h
```

Clean up unused Docker resources:
```bash
docker system prune -a
```
