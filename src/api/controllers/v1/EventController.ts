'use strict';

import GetOne from '../../actions/GetOne';
import config from '../../../config/app';
import logger from '../../../config/logger';
import models from '../../../models';
import AppError from '../../services/AppError';
import {roles} from '../../services/RoleService';
import MobileDeviceService from '../../services/MobileDeviceService';
import EmailService from '../../services/EmailService';
import QueryFilterService from '../../services/QueryFilterService';
import BeamDeviceService from '../../services/BeamDeviceService';
import * as Ajv from 'ajv';
import * as _ from 'lodash';

/**
 * get /account/event/
 */
const getEvents = async function (ctx) {

    const query = QueryFilterService.parseAll(ctx, models.Event);

    const scopes = [
        'defaultScope',
        {method: ['skipBlocked', ctx.state.user.id]},
        {method: ['followingsOf', ctx.state.user.id]},
        {method: ['fromId', ctx.state.user.lastEventId]},
    ];

    const result = await models.Event.scope(scopes).findAndCount(query);

    ctx.body = {data: result};
};

/**
 * get /account/event/unread_count
 */
const getEventsUnreadCount = async function (ctx) {

    const scopes = [
        'defaultScope',
        {method: ['skipBlocked', ctx.state.user.id]},
        {method: ['followingsOf', ctx.state.user.id]},
        {method: ['fromId', ctx.state.user.lastEventId]},
    ];

    const result = await models.Event.scope(scopes).count();

    ctx.body = {data: {count: result}};
};

/**
 * get /account/event/reset
 */
const resetLastEvent = async function (ctx) {

    const user = ctx.state.user;
    const lastEventId = await models.Event.scope({method: ['followingsOf', ctx.state.user.id]}).max('id');
    user.lastEventId = _.isNaN(lastEventId) ? null : lastEventId;

    await user.save();

    ctx.body = {
        data: {
            message: `Reseted last event id`,
            lastEventId
        }
    };
};


/**
 * get /newsfeed
 */
const getNewsfeed = async function (ctx) {

    const query:any = QueryFilterService.parsePagination(ctx);

    const scopes = [
        'defaultScope',
        {method: ['skipBlocked', ctx.state.user.id]},
        {method: ['followingsOf', ctx.state.user.id]},
        {method: ['fromId', ctx.state.user.lastEventId]},
        {method: ['includeAll', ctx.state.user, models]}
    ];

    const result = await models.Event.scope(scopes).findAndCount(query);

    ctx.body = {data: result};
};

/**
 * get /newsfeed_all
 */
const getNewsfeedAll = async function (ctx:any) {

    const query:any = QueryFilterService.parsePagination(ctx);

    const scopes:[any] = [
        'defaultScope',
        {method: ['includeAll', ctx.state.user, models]}
    ];

    const result:any = await models.Event.scope(scopes).findAndCount(query);

    ctx.body = {data: result};
};

export default {
    getEvents,
    getEventsUnreadCount,
    resetLastEvent,
    getNewsfeed,
    getNewsfeedAll
};