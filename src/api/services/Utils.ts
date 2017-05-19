'use strict';

import models from '../../models';
import config from '../../config/app';
import logger from '../../config/logger';
import AppError from './AppError';
import EmailService from './EmailService';
import * as errorToHtml from 'error-to-html';
import * as _ from 'lodash';

/**
 * Get access token from headers or URL params
 * @returns {*}
 */
const getAuthorizationToken = function (ctx) {
    if (ctx.header.authorization) {
        return ctx.header.authorization.substr(7);
    }

    if (ctx.query.access_token) {
        return ctx.query.access_token;
    }

    if (ctx.params.token) {
        return ctx.params.token;
    }

    return false;
};

/**
 * Generate password reset link
 * @param token
 * @returns {string}
 */
const getResetLink = function (token) {
    return config.frontendHost + '/password-recovery/' + token;
};

/**
 * Generate password reset link
 * @param token
 * @returns {string}
 */
const getConfirmLink = function (token) {
    return config.frontendHost + "/confirm/" + token;
};

/**
 * Generate notification disable link
 * @param token
 * @returns {string}
 */
const getNotificationDisableLink = function (token) {
    return config.frontendHost + "/notification-disable/" + token;
};

/**
 * Send formatted error to developer email
 * @param err
 */
const notifyDeveloper = async function (err) {
    logger.error(err.stack);

    if (process.env.DEVELOPER_EMAIL) {
        await EmailService.sendTemplate('alert', process.env.DEVELOPER_EMAIL, {
            title: 'UNCAUGHT EXCEPTION',
            message: errorToHtml(err)
        });
    }

    process.exit(1);
};

const dump = function (obj, print = true) {
    return print ? logger.info(JSON.stringify(obj, null, 2)) : JSON.stringify(obj, null, 2);
};

const mapAnyRows = (rows, params) => {
    return _.chain(rows)
        .map(function(row){
        if(_.isFunction(row)){ return row(params) }
        return row
    }).compact().value();
};

const overrideContentType = function(){
    return function(ctx, next) {
        if (ctx.header['x-amz-sns-message-type']) {
            ctx.header['content-type'] = 'application/json;charset=UTF-8';
        }
        return next();
    };
};

export default {
    getAuthorizationToken,
    getResetLink,
    getNotificationDisableLink,
    getConfirmLink,
    notifyDeveloper,
    dump,
    mapAnyRows,
    overrideContentType
};