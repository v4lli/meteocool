.PHONY: dev prod

dev:
	docker-compose -f docker-compose-dev.yml build
	docker-compose up

prod:
	docker-compose -f docker-compose.yml build
	docker-compose up
