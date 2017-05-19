# :package: Progress Board API & backend

Koa2, Typescript, PostgresDB, sequelize, OpenAPI specification

## Prerequisites:

Install node.js

- `npm install`

- `sudo npm install ts-node -g`

- `sudo npm install typescript -g`

## Run locally

- `create nodemon.json with env params`

- `npm run dev-server`

## Build & compile project

- `npm run build`

## API documentation

We use OpenAPI specification [http://swagger.io/specification/] to describe and render documentation

To update the documentation please update public/swagger.yml file - that is it

What you need to run this app:
* `node` and `npm` (`brew install node`)

Ensure you're running the latest versions:
* Node `v7.x.x`+ 
* NPM `4.x.x`+
* Postgresql `9.5.x`+

## Migrations & seeding

- create an empty migration: `sequelize migration:create --name migration-name`

- rename the the extension of the migration file from .js to .ts

- add migration instruction to the file

- run migration: `npm run migrate`

To run sequelize commands localy, export correct variable DATABASE_URL

`export DATABASE_URL=postgres://postgres:5461@localhost:5432/progress_board`

Create an empty seed:

- `sequelize seed:create --name seed-name`

Docker:

- Install `docker`

- `docker build -t progress_board .`

- `docker run -e DATABASE_URL=postgres://postgres:postgres@localhost:5432/progress_board -e PORT=3000 -p 3000:3000 --net=host progress_board npm run start`

Environment parameters:
- `APP_NAME` - string (default: Progress Board)
- `LOG_LEVEL` - string (default: info)
- `DEVELOPER_EMAIL` - string
- `STAGE` - string
- `PORT` - number (default: 3000)
- `DATABASE_URL` - string 
- `FRONTEND_HOST` - string 
- `JWT_SECRET` - string 
- `JWT_EXPIRES_IN` - number (seconds, default: 3600)
- `RESET_PASSWORD_TOKEN_EXPIRES_IN` - number (seconds, default: 86400) 
- `CONFIRMATION_TOKEN_EXPIRES_IN` - number (seconds, default: 604800 (week)) 
- `REFRESH_TOKEN_EXPIRES_IN` - number (seconds, default: 86400) 
