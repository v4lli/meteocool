.PHONY: docker app dwd

docker: app dwd

app: backend/app/*
	docker build -t meteocool_app backend/app/

dwd: backend/dwd/*
	docker build -t meteocool_dwd backend/app/
