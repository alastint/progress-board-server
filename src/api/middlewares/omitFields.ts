'use strict';

import AppError from '../services/AppError';
import * as _ from 'lodash';

export default (fields = ['id'], inField = "request.body") => {

    return function (ctx, next) {
        let data = _.get(ctx, inField);

        if (_.isEmpty(data)) {return next(`Parameter ctx.${inField} is empty`)}

        if (_.isArray(data)) {
            _.set(ctx, inField, _.map(data, row => {
                return _.omit(row, fields)
            }));

            return next()
        } else {
            _.set(ctx, inField, _.omit(data, fields));
        }

        return next()
    };
};
