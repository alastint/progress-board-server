'use strict';

import config from '../../config/app';
import models from '../../models';
import * as _ from 'lodash';
import AppError from './AppError';

/**
 * Creates reset pass token.
 *
 * @param user
 * @param expiresIn
 */
const createResetPasswordToken = async function (user, expiresIn = config.token.resetPassword.expiresIn) {
    return createToken(user.id, models.Token.types.RESET_PASSWORD_TOKEN, expiresIn)
};

/**
 * Creates confirm signup token.
 *
 * @param user
 * @param expiresIn
 * @returns {Promise<()=>T>}
 */
const createConfirmationToken = async function (user, expiresIn = config.token.confirmSignup.expiresIn) {
    return createToken(user.id, models.Token.types.SIGNUP_CONFIRMATION_TOKEN, expiresIn)
};

/**
 * Creates notification disable token.
 *
 * @param user
 * @param expiresIn
 * @returns {Promise<()=>T>}
 */
const createNotificationDisableToken = async function (user, expiresIn = config.token.disableNotification.expiresIn) {
    return createToken(user.id, models.Token.types.NOTIFICATION_DISABLE_TOKEN, expiresIn)
};

/**
 * Creates refresh token.
 *
 * @param user
 * @param expiresIn
 * @returns {Promise<()=>T>}
 */
const createRefreshToken = async function (user, expiresIn = config.token.refreshToken.expiresIn) {
    return createToken(user.id, models.Token.types.REFRESH_TOKEN, expiresIn)
};

/**
 * Universal method for creation tokens.
 *
 * @param userId
 * @param type
 * @param expiresIn
 * @returns {()=>T}
 */
async function createToken(userId, type, expiresIn) {
    const where = {userId, type};

    await models.Token.destroy({where: {expiresAt: {$lt : new Date()}}});

    const token = await models.Token.create(_.set(where, 'expiresAt', new Date(Date.now() + (expiresIn * 1000))));

    return token.value;
}

export default {
    createNotificationDisableToken,
    createResetPasswordToken,
    createConfirmationToken,
    createRefreshToken
};
