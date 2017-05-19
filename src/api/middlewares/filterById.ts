'use strict';

import * as _ from 'lodash';
import logger from '../../config/logger';
import models from '../../models';
import AppError from '../services/AppError';

const preQuery = (paramName, whereColumnName) => async function (ctx, next) {

    const param = _.get(ctx, paramName);

    if (!param) {throw new AppError(500, `Parameter ctx.${paramName} doesn't exist or is empty`)}

    let where = {};

    if (ctx.query.where) {
        try {
            where = JSON.parse(ctx.query.where)
        } catch (e) {
            throw new AppError(500, 'Parameter `include` is not valid json.', e.Message)
        }
    }

    ctx.query.where = JSON.stringify(_.set(where, whereColumnName, _.toInteger(param)));

    return next();
};

export default preQuery;