.PHONY: dev devrestart

dev:
	docker-compose -f docker-compose-dev.yml build

devrestart:
	docker-compose -f docker-compose-dev.yml down
	docker-compose -f docker-compose-dev.yml up -d

prod:
	docker-compose -f docker-compose.yml build

restart:
	docker-compose down
	docker-compose up -d
