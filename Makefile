.PHONY: dev devrestart

dev:
	docker-compose -f docker-compose-dev.yml build

prod:
	docker-compose -f docker-compose.yml build

prodrestart:
	docker-compose down
	docker-compose up -d

devrestart:
	docker-compose -f docker-compose-dev.yml down
	docker-compose -f docker-compose-dev.yml up -d

devstop:
	docker-compose -f docker-compose-dev.yml down
