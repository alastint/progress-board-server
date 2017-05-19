'use strict';

import config from '../../config/app';
import * as _ from 'lodash';
import logger from '../../config/logger';
import models from '../../models';
import AppError from '../services/AppError';
import Utils from '../services/Utils';
import QueryFilterService from '../services/QueryFilterService';

export default (modelName, scopes:any = ['defaultScope']) => {

    const model = models[modelName];

    if (!model) { throw new AppError(500, `Model with name ${modelName} doesn't exist.`) }

    return async function (ctx) {

        let options = QueryFilterService.parseAll(ctx, model);

        // add extra fields, which could be defined in models.
        // this fields could be defined as functions.
        // also we need to consolidate these with requested list of fields.
        if (model.extraFields && _.isFunction(model.extraFields)) {
            let extraFields = model.extraFields();
            if (options.attributes && _.size(options.attributes) > 0) {
                extraFields = _.pick(extraFields, options.attributes);
                options.attributes = _.chain(options.attributes)
                    .intersection(_.keys(model.attributes))
                    .concat(Utils.mapAnyRows(extraFields, ctx))
                    .value();
            } else {
                options.attributes = {include: Utils.mapAnyRows(extraFields, ctx)};
            }
        }

        const newScopes = _.map(scopes, function (scope:any) {
            if(_.isString(scope)){ return scope }

            if(_.isObject(scope)){
                return {method: [scope.method, _.get(ctx, scope.key)]}
            }
        });

         console.log(newScopes);

        ctx.body = await model.scope(_.compact(newScopes)).findAndCount(options);

        logger.info(`Found ${ctx.body.count} records of ${modelName} by request `, ctx.query);
    }
};