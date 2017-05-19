'use strict';

import config from '../../config/app';
import logger from '../../config/logger';
import models from '../../models';
import AppError from '../services/AppError';
import ActionService from '../services/ActionService';
import * as Ajv from 'ajv';
import * as _ from 'lodash';

export default (modelName, preProcessors = [ActionService.checkOwnerAccess()], paramName = 'id') => {

    const model = models[modelName];

    if (!model) { throw new AppError(500, `Model with name ${modelName} doesn't exist.`) }

    const ajv = Ajv({allErrors: true});

    return async function (ctx) {

        const data = ctx.request.body;
        const id = ctx.params[paramName];

        // check entity
        let entityRow = ctx.state[_.camelCase(modelName)] || await model.findById(id);
        if (!entityRow) throw new AppError(404, 'Entity not found!');

        // validation part
        const schema = model.schema;
        if (schema) {
            delete schema.required;

            let valid = ajv.validate(schema, data);
            if (!valid) {throw new AppError(400, ajv.errorsText(), ajv.errors.toString())}
        } else {
            logger.warn(`Model ${modelName} doesn't have defined validation schema`)
        }

        // process additional specific verifications
        if(_.size(preProcessors) > 0) {
            _.each(preProcessors, preProcess => {
                entityRow = preProcess(ctx, entityRow); // could throw an exception if something is wrong
            })
        }

        let result = await model.update(data, {where: {id}});

        ctx.body = {data: {count: result}};

        logger.info(`Updated record of ${modelName} by ID : ${id}. Data`, data);
    }
};