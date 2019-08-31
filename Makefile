.PHONY: dev devrestart prod prodrestart devstop prodstop record recording snapshot

BASE_CMD := docker-compose -f docker-compose.yml
DEV_CMD := $(BASE_CMD) -f docker-compose-dev.yml
PROD_CMD := $(BASE_CMD) -f docker-compose-prod.yml
RECORD_CMD := $(PROD_CMD) -f docker-compose-record.yml

dev:
	$(DEV_CMD) build --parallel

devrestart:
	$(DEV_CMD) down
	$(DEV_CMD) up
	#docker logs -f $$(docker ps | grep meteocool_datasource | cut -d ' ' -f1)

devstop:
	$(DEV_CMD) down


prod:
	test -d private || git clone git@github.com:v4lli/meteocool-private.git private
	test -d private && make -C private/ BASE=$$(pwd)
	$(PROD_CMD) build

prodrestart:
	$(PROD_CMD) down
	$(PROD_CMD) up -d

prodstop:
	docker-compose -f docker-compose.yml down


record recording:
	$(RECORD_CMD) build
	$(RECORD_CMD) down
	$(RECORD_CMD) up -d

snapshot:
	docker exec -it $$(docker ps | grep meteocool_datasource | cut -d ' ' -f1) /usr/src/app/api_snapshot.sh
	docker exec -it $$(docker ps | grep meteocool_datasource | cut -d ' ' -f1) ls -lahb /recording

