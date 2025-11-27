.PHONY: up down build logs shell test

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

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

seed:
	docker-compose exec backend python scripts/seed-data.py
