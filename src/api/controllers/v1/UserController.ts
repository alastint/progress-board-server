'use strict';

import config from '../../../config/app';
import logger from '../../../config/logger';
import models from '../../../models';
import AppError from '../../services/AppError';
import EmailService from '../../services/EmailService';
import {roles} from '../../services/RoleService';

import * as _ from 'lodash';

/**
 * put /user/bulk/status
 * @param ctx
 */
const setStatus = async function (ctx) {

    const idList = ctx.request.body.id;
    if (!_.isArray(idList)) {throw new AppError(400, 'Body ID should be an array.')}

    let status = ctx.request.body.status;
    if (!_.includes(models.User.statuses, status)) {
        throw new AppError(400, 'Status should be one of : ' + _.chain(models.User.statuses).values().join(' or ').value());
    }

    if (_.includes(idList, ctx.state.user.id)) {throw new AppError(400, 'You can`t change status of your profile')}

    let result = await models.User.update({status}, {where: {id: {$in: idList}}});
    ctx.body = {data: result};
};

const processPublisherRequest = async function (ctx) {

    const user = ctx.state.account;

    if (user.role != roles.PUBLISHER_PENDING) {throw new AppError(400, "User doesn't have role 'pending publisher'")}

    let message = "";
    switch (_.toLower(ctx.params.action)) {
        case 'accept' :
            user.role = roles.PUBLISHER;
            message = "Your request is accepted";
            break;
        case 'reject' :
            user.role = roles.USER;
            message = "Your request is rejected";
            break;
        default:
            throw new AppError(400, "Unknown action '" + ctx.params.action + "'.")
    }

    await user.save();

    if (user.emailVerified) {
        await EmailService.sendTemplate('publisher_request_result', [user.email], {message});
    }

    ctx.body = {data: {message: "Request processed successful"}};
};

/**
 * post /user/:id/block
 */
const addToBlackList = async function (ctx) {

    if(ctx.state.user.id == ctx.state.account.id){ throw new AppError(400, 'You cannot block yourself') }

    const description = _.toString(ctx.request.body.description);

    const data = {
        userId: ctx.state.user.id,
        accusedUserId: ctx.state.account.id
    };
    const id = ctx.state.account.id;
    const userId = ctx.state.user.id;

    const result = await models.UserBlackList.findOrCreate({where : data, defaults: _.set(data, 'description', description)});

    ctx.body = {data: result[0]};

    await models.Follow.destroy({where: {$or: [{followerId:id, followingId:userId}, {followerId:userId, followingId:id}]}});
    if(result[1]) {
        await EmailService.sendTemplate('user_block', config.email.supportEmails, {
            message: `User ${ctx.state.user.email} blocked user ${ctx.state.account.email}`
        });
    }
};

/**
 * delete /user/:id/block
 */
const removeFromBlackList = async function (ctx) {

    const result = await models.UserBlackList.destroy({
        where : {
            userId: ctx.state.user.id,
            accusedUserId: ctx.state.account.id,
        }
    });

    ctx.body = {data: result};
};

export default {
    setStatus,
    processPublisherRequest,
    addToBlackList,
    removeFromBlackList
};