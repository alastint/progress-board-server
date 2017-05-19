'use strict';

import config from '../../config/app';
import logger from '../../config/logger';
import models from '../../models';
import AppError from '../services/AppError';
import ActionService from '../services/ActionService';
import * as _ from 'lodash';

export default (modelName, preProcessors = [ActionService.checkOwnerAccess()], paramName = 'id') => {

    const model = models[modelName];

    if(!model) { throw new AppError(500, `Model with name ${modelName} doesn't exist.`) }

    return async function (ctx) {

        let id = ctx.params[paramName];

        if (modelName === 'User' && id === ctx.state.user.id) {throw new AppError(400, 'You can\'t remove yourself!')}

        // check entity
        let entityRow = await model.findById(id);
        if (!entityRow) throw new AppError(404, 'Entity not found!');

        // process additional specific verifications
        if(_.size(preProcessors) > 0) {
            _.each(preProcessors, preProcess => {
                entityRow = preProcess(ctx, entityRow); // could throw an exception if something is wrong
            })
        }

        let count = await entityRow.destroy();

        ctx.body = {data: {count}};

        logger.info(`Deleted record of ${modelName} by ID : ${id}`);
    }
};