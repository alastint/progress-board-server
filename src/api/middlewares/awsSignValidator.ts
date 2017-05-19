'use strict';

import config from '../../config/app';
import logger from '../../config/logger';
import AppError from '../services/AppError';
import * as _ from 'lodash';
import * as Bluebird from "bluebird";
import * as MessageValidator from "sns-validator";

export default function (ctx, next) {

    const validator = new MessageValidator();

    return validator.validate(ctx.request.body, function (err, message) {
        if (err) {throw new AppError(400, err.message)}
        logger.verbose(message);
        next();
    });
}
