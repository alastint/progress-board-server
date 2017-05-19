'use strict';

import sequelize from './connection';
import config from './app';
import logger from './logger';

const bootstrap = async function () {
	logger.info('bootstrapping...');

	try {
		await sequelize.authenticate();
	} catch (err) {
		logger.error('unable to connect to the database: ', err);
	}

	logger.info(`connected to database ${config.db.url}`);

	/*TODO: check if all environment variables are set */

};

export default bootstrap;