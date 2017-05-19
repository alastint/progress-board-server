'use strict';
import { install } from 'source-map-support';
install();

import * as Koa from 'koa';
import * as serve from 'koa-static';
import * as compress from 'koa-compress';
import * as koaLogger from 'koa-logger';
import * as convert from 'koa-convert';
import * as json from 'koa-json';
import * as bodyParser from 'koa-bodyparser';
import * as helmet from 'koa-helmet';
import * as cors from 'koa-cors';
import logger from './config/logger';
import config from './config/app';
import router from './config/routes';
import Utils from './api/services/Utils';
import catchError from './api/middlewares/catchError';
import bootstrap from './config/bootstrap';

process.on('uncaughtException', function(err) {
	Utils.notifyDeveloper(err);
});

const app = new Koa();

app.on('error', function (err) {
	Utils.notifyDeveloper(err);
});
console.info(__dirname);
bootstrap().then(() => {
	app.use(helmet());
	app.use(convert(cors({origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', headers: 'Content-Type, Authorization'})));
	app.use(catchError());
	app.use(Utils.overrideContentType());
	app.use(convert(bodyParser()));
	app.use(convert(json()));
	app.use(convert(koaLogger()));
	app.use(convert(router.routes()));
	app.use(convert(router.allowedMethods()));
	app.use(convert(compress()));
	app.use(convert(serve(__dirname + '/../public')));

	app.listen(config.port, () => logger.info(`server started at ${config.port}`));
})
.catch(err => {
	logger.error('bootstrap catch: ', err.stack);
	Utils.notifyDeveloper(err);
});

export default app;