'use strict';

import * as _ from 'lodash'
import AppError from './AppError'
import RoleService from './RoleService'
import models from '../../models'
import logger from "../../config/logger";

const checkOwnerAccess = (ownerFieldName = 'userId') => {
    return function (ctx, instance) {

        const user = ctx.state.user;

        if (RoleService.roleIsAdmin(user.role)) { return instance }

        if (!instance[ownerFieldName]) {
            logger.warn(`[ActionService] Field ${ownerFieldName} doesn't exist at model ${instance}`);
            return instance;
        }

        if (instance[ownerFieldName] != user.id) {throw new AppError(403, "Forbidden, you are not owner.")}

        return instance;
    }
};

const setOwner = (ownerFieldName = 'userId') => {
    return async function (ctx, instance) {

        const user = ctx.state.user;

        if (RoleService.roleIsAdmin(user.role) && !_.isEmpty(instance[ownerFieldName])) { return true }

        instance[ownerFieldName] = user.id;

        return instance;
    }
};

export default {
    checkOwnerAccess,
    setOwner
}

