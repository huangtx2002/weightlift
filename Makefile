.PHONY: help start stop restart build logs clean dev-db test

help: ## Show this help message
	@echo "Topset Docker Commands"
	@echo "======================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

start: ## Start all services (build if needed)
	@echo "🚀 Starting all services..."
	docker-compose up -d --build

stop: ## Stop all services
	@echo "🛑 Stopping all services..."
	docker-compose down

restart: ## Restart all services
	@echo "🔄 Restarting all services..."
	docker-compose restart

build: ## Rebuild all services
	@echo "🔨 Building all services..."
	docker-compose build --no-cache

logs: ## Show logs for all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

logs-db: ## Show database logs
	docker-compose logs -f db

clean: ## Stop and remove all containers, networks, and volumes
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	@echo "✅ All cleaned up!"

dev-db: ## Start only the database (for local dev)
	@echo "🗄️  Starting database only..."
	docker-compose up -d db

status: ## Show status of all containers
	docker-compose ps

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-db: ## Open MySQL shell
	docker-compose exec db mysql -u lifting_app -plifting_password lifting

prisma-migrate: ## Run Prisma migrations
	docker-compose exec backend npx prisma migrate dev

prisma-studio: ## Open Prisma Studio
	docker-compose exec backend npx prisma studio

prisma-generate: ## Generate Prisma Client
	docker-compose exec backend npx prisma generate

health: ## Check health of all services
	@echo "🏥 Checking service health..."
	@curl -s http://localhost:8002/health && echo "\n✅ Backend is healthy" || echo "\n❌ Backend is not responding"
	@curl -s http://localhost:5273 > /dev/null && echo "✅ Frontend is healthy" || echo "❌ Frontend is not responding"
