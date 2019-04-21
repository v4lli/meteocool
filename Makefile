.PHONY: dev devrestart

dev:
	docker-compose -f docker-compose-dev.yml build

prod:
	test -d private || git clone git@github.com:v4lli/meteocool-private.git private
	test -d private && make -C private/ BASE=$$(pwd)
	docker-compose -f docker-compose.yml build

prodrestart:
	docker-compose down
	docker-compose up -d

devrestart:
	docker-compose -f docker-compose-dev.yml down
	docker-compose -f docker-compose-dev.yml up -d

devstop:
	docker-compose -f docker-compose-dev.yml down

prodstop:
	docker-compose -f docker-compose.yml down
