'use strict';

import GetOne from '../../actions/GetOne';
import GetList from '../../actions/GetList';
import config from '../../../config/app';
import logger from '../../../config/logger';
import models from '../../../models';
import AppError from '../../services/AppError';
import {roles} from '../../services/RoleService';
import EmailService from '../../services/EmailService';
import QueryFilterService from '../../services/QueryFilterService';
import * as Ajv from 'ajv';
import * as _ from 'lodash';
import * as Bluebird from "bluebird";

const ajv = Ajv({allErrors: true});

/**
 * Get users profile data
 * get /account
 * @param ctx
 */
const getProfile = function (ctx) {
    const action = GetOne('User');
    ctx.params.id = ctx.state.user.id;
    return action(ctx);
};

/**
 * Set user's profile data
 * put /account
 * @param ctx
 */
const updateProfile = async function (ctx) {

    const user = ctx.state.user;
    const data = ctx.request.body;
    const schema = models.User.schema;

    delete schema.required;

    let valid = ajv.validate(schema, data);
    if (!valid) {throw new AppError(400, ajv.errorsText(), ajv.errors.toString())}

    await models.User.update(data, {
        where: {id: user.id},
        returning: true,
        limit: 1
    });

    const newUser = await models.User.findById(user.id);

    ctx.body = {data: newUser.toJSON()};
};

/**
 * post /account/picture/upload
 * @param ctx
 */
const createUploadUrl = function (ctx) {
    const name = ctx.request.body.name;
    ctx.body = {data: ctx.state.user.createUploadUrl(name)};
};

/**
 * post /account/request/publisher
 * @param ctx
 */
const createPublisherRequest = async function (ctx) {

    const user = ctx.state.user;

    logger.info(`User with email ${user.email} tried to request publisher role`);

    if (_.chain(roles).omit(['ADMIN', 'SUPER_ADMIN', 'PUBLISHER']).values().includes(user.role).value()) {
        throw new AppError(400, "You already are as an publisher")
    }

    if (user.role == roles.PUBLISHER_PENDING) {throw new AppError(400, "Your request already exists")}

    user.role = roles.PUBLISHER_PENDING;
    await user.save();

    await EmailService.sendTemplate('partner_request', config.email.supportEmails, {email: user.email});

    ctx.body = {data: {message: "You sent request to be a publisher. Please wait until admin will process it."}};
};

/**
 * get /account/event/:lastDate
 */
const getEvents = async function (ctx) {

    const query = QueryFilterService.parseAll(ctx, models.Event);

    const scopes = [
        {method: ['followingsOf', ctx.state.user.id]},
        {method: ['fromId', 4 || ctx.state.user.lastEventId]},
    ];

    const result = await models.Event.scope(scopes).findAndCount(query);

    ctx.body = {data: result};
};

/**
 * get /account/event/reset
 */
const resetLastEvent = async function (ctx) {

    const user = ctx.state.user;
    const lastEventId = await models.Event.scope({method: ['followingsOf', ctx.state.user.id]}).max('id');
    user.lastEventId = lastEventId;

    await user.save();

    ctx.body = {
        data: {
            message: `Reseted last event id`,
            lastEventId
        }
    };
};

/**
 * get /account/blacklist/[user,beam]
 */
const getBlackList = (modelName) => {

    return async function (ctx) {

        const scopes:any = [{method: 'blocked', key: 'state.user.id'}];

        const action = GetList(modelName, scopes);

        return action(ctx)
    }
};

export default {
    getProfile,
    updateProfile,
    createUploadUrl,
    createPublisherRequest,
    getEvents,
    resetLastEvent,
    getBlackList
};