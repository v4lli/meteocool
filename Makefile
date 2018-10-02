.PHONY: dev prod

dev:
	docker-compose -f docker-compose-dev.yml build

prod:
	docker-compose -f docker-compose.yml build

restart:
	docker-compose down
	docker-compose up -d
