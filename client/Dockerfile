# copy
FROM node:20-alpine3.19 as copy

WORKDIR /app

COPY . .
COPY ./.env.deploy ./.env

# build
FROM copy as build

WORKDIR /app

RUN npm i --no-fund --no-audit --legacy-peer-deps
RUN npm run build

# run
FROM ghcr.io/nginxinc/nginx-unprivileged:1.25.4-alpine3.18

RUN rm /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/conf.d/
#COPY ./deploy/certificate.crt /etc/nginx/ssl/certificate.crt
#COPY ./deploy/private-key.key /etc/nginx/ssl/private-key.key

USER 101:101

EXPOSE 80
#EXPOSE 443

ENTRYPOINT ["nginx", "-g", "daemon off;"]
