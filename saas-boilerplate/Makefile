.PHONY: build up down logs shell migrate test

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

shell:
	docker-compose exec backend python manage.py shell

migrate:
	docker-compose exec backend python manage.py migrate

makemigrations:
	docker-compose exec backend python manage.py makemigrations

test:
	docker-compose exec backend pytest

test-frontend:
	docker-compose exec frontend npm test

setup:
	cp .env.example .env
	docker-compose build
	docker-compose up -d
	@echo "Waiting for database..."
	sleep 5
	docker-compose exec backend python manage.py migrate
	@echo "Setup complete! Visit http://localhost:5173"
