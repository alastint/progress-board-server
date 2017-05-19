'use strict';

import logger from '../../config/logger';
import models from '../../models';
import * as _ from 'lodash';
import AppError from '../services/AppError';

const checkEntity = (param = 'id', delimiter = ',') => async function (ctx, next) {

    if(!_.has(ctx.params, param)) throw new AppError(500, `Parameter '${param}' doesn't exists in parameter list.`);
    if(!_.get(ctx.params, param)) throw new AppError(500, `Parameter '${param}' should not be empty`);

    let rawList = ctx.params[param];

    ctx.params[param] = _.split(rawList, delimiter);

    return next();
};

export default checkEntity;