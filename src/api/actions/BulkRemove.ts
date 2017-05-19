'use strict';

import config from '../../config/app';
import logger from '../../config/logger';
import models from '../../models';
import AppError from '../services/AppError';
import ActionService from '../services/ActionService';
import QueryFilterService from '../services/QueryFilterService';
import * as _ from 'lodash';

export default (modelName, preProcessors = [ActionService.checkOwnerAccess()],) => {

    const model = models[modelName];

    if (!model) { throw new AppError(500, `Model with name ${modelName} doesn't exist.`) }

    return async function (ctx) {

        let idList = ctx.request.body.id;

        if (_.size(idList) == 0) { throw new AppError(400, 'List of IDs should not be empty') }
        if (modelName === 'User' && _.includes(idList, ctx.state.user.id)) { throw new AppError(400, 'You can\'t remove yourself!') }

        let instances = await model.findAll({where: {id: {$in: idList}}});

        // process additional specific verifications
        if(_.size(preProcessors) > 0) {
            _.each(preProcessors, preProcess => {
                instances = _.map(instances, _.partial(preProcess, ctx)); // could throw an exception if something is wrong
            })
        }

        let count = await model.destroy({where: {id: {$in: idList}}});

        ctx.body = {data: {count}};

        logger.info(`Removed ${count} rows of model ${modelName}`);
    }
};