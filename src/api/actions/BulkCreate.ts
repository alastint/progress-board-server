'use strict';

import config from '../../config/app';
import logger from '../../config/logger';
import models from '../../models';
import AppError from '../services/AppError';
import * as Ajv from 'ajv';
import * as _ from 'lodash';


export default (modelName) => {

    const model = models[modelName];

    if(!model) { throw new AppError(500, `Model with name ${modelName} doesn't exist.`) }

    const ajv = Ajv({allErrors: true});

    return async function (ctx) {

        const entityRows = ctx.request.body;

        if (!_.isArray(entityRows)) { throw new AppError(400, 'Request body should be an array') }

        const schema = model.schema;

        if(schema) {
            _.each(entityRows, function (entityRow) {
                let valid = ajv.validate(schema, entityRow);
                if (!valid) {throw new AppError(400, ajv.errorsText(), ajv.errors.toString())}
            });
        } else {
            logger.warn(`Model ${modelName} doesn't have defined validation schema`)
        }

        let result = await model.bulkCreate(entityRows, {individualHooks : true});

        ctx.status = 201;
        ctx.body = {data: result};

        logger.info(`Created ${_.size(result)} rows of model ${modelName}`);
    }
};