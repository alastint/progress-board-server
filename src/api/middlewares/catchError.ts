'use strict';

import AppError from '../services/AppError';
import logger from '../../config/logger';
import * as _ from 'lodash';

const catchError = async function (ctx, next) {
    try {
        await next();
    } catch (err) {
        //console.info('catch', err);
        /** Handle Sequelize validation  errors */
        if (err.name && err.name === 'SequelizeUniqueConstraintError' && err.errors) {

            let errorMessage = '';
            _.each(err.errors, (e) => {
                errorMessage += e.message;
            });

            logger.warn('[SequelizeUniqueConstraintError]', 400, errorMessage, err.errors);

            ctx.status = 400;
            ctx.body = {
                error: {
                    message: errorMessage
                }
            };
            return;
        }

        if( err.httpStatus && err.httpStatus >= 400 && err.httpStatus < 500 ) {

            logger.warn('[AppError]', err.httpStatus, err.message);

            ctx.status = err.httpStatus;
            ctx.body = {
                error: {
                    message: err.message,
                }
            };
        } else {
            /** Unhandled errors and exceptions */
            logger.error(err);
            ctx.status = 500;
            ctx.body = {
                error: {
                    message: 'Server error',
                    developerMessage: err.message
                }
            };
        }

        if (process.env.STAGE === 'master') delete ctx.body.error.developerMessage;
    }
};

export default () => catchError;