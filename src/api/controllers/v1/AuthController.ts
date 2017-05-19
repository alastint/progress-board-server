'use strict';

import * as _ from 'lodash';
import * as Ajv from 'ajv';
import AppError from '../../services/AppError';
import AuthService from '../../services/AuthService';
import EmailService from '../../services/EmailService';
import TokenService from '../../services/TokenService';
import NotificationService from '../../services/NotificationService';
import Utils from '../../services/Utils';
//import logger from '../../../config/logger';
import models from '../../../models';
import logger from "../../../config/logger";

const ajv = Ajv({allErrors: true});

const signupSchema = {
    type: 'object',
    properties: {
        firstName: {type: 'string'},
        lastName: {type: 'string'},
        email: {type: 'string', format: 'email'},
        password: {
            type: ['string', 'integer'],
            minLength: 4
        },
        pictureName: {type: 'string'},
        description: {type: 'string'},
        dob: {type: 'string'},
        gender: {type: 'string'},
    },
    //additionalProperties: false,
    required: ['email', 'password']
};

const signinSchema = {
    type: 'object',
    properties: {
        email: {type: 'string', format: 'email'},
        password: {
            type: ['string', 'integer'],
            minLength: 4
        },
        device: {
            type: ["object", "null"],
            patternProperties: {
                "^(uuid|platform|token)$": {type: "string"}
            },
            additionalProperties: false
        }
    },
    additionalProperties: false,
    required: ['email', 'password']
};

/**
 * post /v1/signin
 */
const signin = async function (ctx) {
    let data = ctx.request.body;

    let validCredentials = ajv.validate(signinSchema, data);
    if (!validCredentials) {throw new AppError(400, ajv.errorsText(), ajv.errors.toString())}

    let user = await models.User.findOne({where: {email: data.email}});

    if (!user) throw new AppError(400,`User with email ${data.email} doesn't exist.`);
    if (user.isDisabled()) throw new AppError(403, 'Your account is disabled.');

    let valid = await AuthService.comparePasswords(data.password, user.password);
    if (!valid) throw new AppError(400, 'Email or password is wrong.');

    const userJSON = user.toJSON();

    userJSON.authToken = AuthService.signToken({
        id: user.id,
        email: user.email
    });
    userJSON.refreshToken = await TokenService.createRefreshToken(user);

    ctx.body = {data: userJSON};

    logger.silly(`User signin with email : ${user.email}`)
};

/**
 * post /v1/signup
 */
const signup = async function (ctx) {
    let data = ctx.request.body;

    let valid = ajv.validate(signupSchema, data);
    if (!valid) {throw new AppError(400, ajv.errorsText(), ajv.errors.toString())}

    let user = await models.User.findOne({where: {email: data.email}});
    if (user) {throw new AppError(400, `User with email ${data.email} already exists.`)}

    const created = await models.User.create(data);

    //await NotificationService.sendConfirmationEmail(created);

    // new user can use api immediately
    const userJSON = created.toJSON();

    userJSON.authToken = AuthService.signToken({
        id: created.id,
        email: created.email
    });
    userJSON.refreshToken = await TokenService.createRefreshToken(created);

    ctx.body = {data: userJSON};

    logger.silly(`User signup with email : ${created.email}`)
};

/**
 * post /v1/signup/confirm/
 */
const signupConfirmation = async function (ctx) {
    const confirmToken = ctx.request.body.token;

    if (_.isEmpty(confirmToken)) {throw new AppError(400, 'Refresh token is required.')}

    let token = await models.Token.findOne({
        where: {
            value: confirmToken,
            type: models.Token.types.SIGNUP_CONFIRMATION_TOKEN,
            expiresAt: {$gt: new Date()}
        },
        include: [{model: models.User, as: 'user'}]
    });

    if (!token || !token.user) throw new AppError(400, 'Confirmation token is invalid or expired.');

    await models.User.update({
        // status: models.User.statuses.ENABLED,
        emailVerified: true
    }, {where: {id: token.user.id}});

    await models.Token.destroy({where: {userId: token.user.id, type: 'confirmation_token'}});

    ctx.body = {data: {message: "Thanks for your confirmation. Now you can try to sign in."}};

    logger.silly(`User confirmed signup with email : ${token.user.email}`)
};

/**
 * post /v1/notification/disable
 */
const notificationDisableConfirmation = async function (ctx) {
    const confirmToken = ctx.request.body.token;

    if (_.isEmpty(confirmToken)) {throw new AppError(400, 'Notification disable token is required.')}

    let token = await models.Token.findOne({
        where: {
            value: confirmToken,
            type: models.Token.types.NOTIFICATION_DISABLE_TOKEN,
            expiresAt: {$gt: new Date()}
        },
        include: [{model: models.User, as: 'user'}]
    });

    if (!token || !token.user) throw new AppError(400, 'Notification disable token is invalid or expired.');

    await models.User.update({
        enableNotification: false
    }, {where: {id: token.user.id}});

    await models.Token.destroy({where: {userId: token.user.id, type: 'notification_disable_token'}});

    ctx.body = {data: {message: "Notifications disabled"}};

    logger.silly(`User disabled notifications with email : ${token.user.email}`)
};

/**
 * post /v1/account/resetPassword
 */
const resetPassword = async function (ctx) {
    let email = ctx.params.email;

    if (!email) {throw new AppError(400, 'Email is required')}

    let user = await models.User.findOne({where: {email}});

    if (!user) throw new AppError(400, 'User not found.');

    await NotificationService.sendResetPasswordEmail(user);

    ctx.body = {data: {message: 'Please check your mailbox'}};

    logger.silly(`User requested reset password with email : ${user.email}`)
};

/**
 * post /setPassword
 */
const setPassword = async function (ctx) {
    const password = ctx.request.body.password;

    if (_.isEmpty(password)) {throw new AppError(400, 'Password is required.')}

    const resetPasswordToken = Utils.getAuthorizationToken(ctx);

    if (_.isEmpty(resetPasswordToken)) {throw new AppError(400, 'Refresh token is required.')}

    let token = await models.Token.findOne({
        where: {
            value: resetPasswordToken,
            type: models.Token.types.RESET_PASSWORD_TOKEN,
            expiresAt: {$gt: new Date()}
        },
        include: [{model: models.User, as: 'user'}]
    });

    const user = token.user;

    if (!token || !user) throw new AppError(400, 'Reset token is invalid or expired.');

    //await models.User.update({password}, {where: {id: token.user.id}});

    user.password = password;
    await user.save();
    await models.Token.destroy({where: {userId: user.id, type: 'reset_password_token'}});

    ctx.body = {data: {message: 'Ok, Try to signin'}};

    logger.silly(`User did updated password with email : ${token.user.email}`)
};

/**
 * post /refresh_token
 */
const refreshToken = async function (ctx) {
    const refreshToken = ctx.request.body.token;

    if (_.isEmpty(refreshToken)) {throw new AppError(400, 'Refresh token is required.')}

    let token = await models.Token.findOne({
        where: {
            value: refreshToken,
            type: models.Token.types.REFRESH_TOKEN,
            expiresAt: {$gt: new Date()}
        },
        include: [{model: models.User, as: 'user'}]
    });

    if (!token || !token.user) throw new AppError(400, 'Refresh token is invalid or expired.');

    const authToken = AuthService.signToken({
        id: token.user.id,
        email: token.user.email
    });

    const newRefreshToken = await TokenService.createRefreshToken(token.user);

    await token.destroy();

    ctx.body = {data: {authToken, refreshToken: newRefreshToken}};
};

export default {
    signin,
    signup,
    refreshToken,
    resetPassword,
    setPassword,
    signupConfirmation,
    notificationDisableConfirmation
};