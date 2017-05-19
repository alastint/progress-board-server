'use strict';

import * as winston from 'winston';

const logger = new winston.Logger({
	level: process.env.LOG_LEVEL || 'info',
	transports: [
		new (winston.transports.Console)({
			colorize: true,
			timestamp: function() {
				return (new Date()).toISOString();
			},
			formatter: function(options) {
				// Return string will be passed to logger.
				return options.timestamp() +' : '+ options.level.toUpperCase() +' - '+ (options.message ? options.message : '') +
					(options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
			}
		})
	],
});

export default logger