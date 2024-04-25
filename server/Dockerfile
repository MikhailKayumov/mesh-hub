# prepare
FROM node:20-alpine3.19 as prepare

WORKDIR /app

COPY . .

# build
FROM prepare as build

WORKDIR /app

RUN npm i --no-fund --no-audit
RUN npm run build

# run
FROM node:20-alpine3.19 as run

WORKDIR /app

COPY --from=build /app/ ./

ENV npm_config_cache /home/node/app/.npm
RUN mkdir -p /home/node/app
RUN chown 1001:1001 /home/node/app

EXPOSE 8080

CMD ["npm", "run", "prod"]
