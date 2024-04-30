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

EXPOSE 8080

ENTRYPOINT ["npm", "run", "prod"]
