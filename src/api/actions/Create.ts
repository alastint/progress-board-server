'use strict';

import config from '../../config/app';
import logger from '../../config/logger';
import models from '../../models';
import AppError from '../services/AppError';
import ActionService from '../services/ActionService';
import * as Ajv from 'ajv';
import * as _ from 'lodash';


export default (modelName, preProcessors = []) => {

    const model = models[modelName];

    if(!model) { throw new AppError(500, `Model with name ${modelName} doesn't exist.`) }

    const ajv = Ajv({allErrors: true});

    return async function (ctx) {

        let data:any = ctx.request.body;

        // process additional specific verifications
        if(_.size(preProcessors) > 0) {

            for(let i in preProcessors){
                data = await preProcessors[i](ctx, data); // could throw an exception if something is wrong
            }
        }

        const schema = model.schema;
        if(schema) {
            let valid = ajv.validate(schema, data);
            if (!valid) {throw new AppError(400, ajv.errorsText(), ajv.errors.toString())}
        } else {
            logger.warn(`Model ${modelName} doesn't have defined validation schema`)
        }

        let entity = await model.create(data);

        ctx.status = 201;
        ctx.body = {data: entity};

        logger.info(`Created new record of ${modelName}`);
    }
};