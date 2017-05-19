'use strict';

import Utils from '../services/Utils';
import AuthService from '../services/AuthService';
import AppError from '../services/AppError';
import models from '../../models';
import logger from "../../config/logger";
import * as _ from 'lodash';

/**
 * Check authorization token
 * @param ctx
 * @param next
 * @returns {*}
 */
const authenticate = async function (ctx, next) {
    let token = Utils.getAuthorizationToken(ctx);

    if (!token) {
        logger.info("User isn`t authenticated");
        return next();
    }

    // if (!token) {
    // 	ctx.status = 403;
    // 	ctx.body = {
    // 		error: {
    // 			message: 'Access token is required!'
    // 		}
    // 	};
    // 	return;
    // }

    let decoded;
    try {
        decoded = await AuthService.verifyToken(token);
    } catch (err) {
        throw new AppError(401, err.message);
    }

    let account = await models.User.find({where: {email: decoded.email}});

    if (!account) {throw new AppError(400, 'Email doesn`t exist for this token')}

    _.set(ctx, 'state.user', account);

    return next();
};

export default authenticate;