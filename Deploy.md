# СДМ Банк. B2B Портал

## Сборка архивов docker образов

Команды исполнять из корня проекта

### Сборка архива docker образа для сервера

Имя образа **sdm-b2b-marketplace-prod-server**

1. Собрать образ

Добавить в папку deploy .env.server файл (пример лежит в папке server)

```shell
docker build --no-cache -t sdm-b2b-marketplace-prod-server:v1 -f ./deploy/server.Dockerfile .
```

2. Заархивировать образ

```shell
docker save sdm-b2b-marketplace-prod-server:v1 -o ./deploy/sdm-b2b-marketplace-prod-server.tar
```

3. Скопировать архив на сервер и разархивировать

```shell
docker load --input ./deploy/sdm-b2b-marketplace-prod-server.tar
```

### Сборка архива docker образа для клиента

Image name **sdm-b2b-marketplace-prod-web**

1. Собрать образ

Добавить в папку deploy .env.web файл (пример лежит в папке web)

```shell
docker build --no-cache -t sdm-b2b-marketplace-prod-web:v1 -f ./deploy/web.Dockerfile .
```

2. Заархивировать образ

```shell
docker save sdm-b2b-marketplace-prod-web:v1 -o ./deploy/sdm-b2b-marketplace-prod-web.tar
```

3. Скопировать архив на сервер и разархивировать

```shell
docker load --input ./deploy/sdm-b2b-marketplace-prod-web.tar
```

## Запуск docker compose

Загрузить docker-compose.yml, default.conf, .env.web, .env.server, certificate.crt и private-key.key в папку deploy

- .env.server - для сервера
- .env.web - для клиента

Запустить

```shell
docker-compose -f ./deploy/docker-compose.yml down && docker-compose -f ./deploy/docker-compose.yml up -d
```
