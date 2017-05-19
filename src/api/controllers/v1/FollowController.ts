'use strict';

import config from '../../../config/app';
import logger from '../../../config/logger';
import models from '../../../models';
import AppError from '../../services/AppError';
import EmailService from '../../services/EmailService';
import QueryFilterService from '../../services/QueryFilterService';
import NotificationService from '../../services/NotificationService';
import Utils from '../../services/Utils';
import EventService from '../../services/EventService';
import * as _ from 'lodash';


/**
 * get /user/:id/followers
 * @param ctx
 */
const getFollowers = async function (ctx) {

    const id = ctx.params.id;
    const query = QueryFilterService.parseAll(ctx, models.Follow);

    query.where = {followingId: id};

    if (ctx.state.user.id != id) {
        query.where.status = models.Follow.statuses.ACCEPTED
    }

    const result = await models.Follow.findAndCount(query);

    ctx.body = {data: result};
};

/**
 * get /user/:id/followings
 * @param ctx
 */
const getFollowings = async function (ctx) {

    const id = ctx.params.id;
    const query = QueryFilterService.parseAll(ctx, models.Follow);

    query.where = {followerId: id};

    if (ctx.state.user.id != id) {
        query.where.status = models.Follow.statuses.ACCEPTED
    }

    const result = await models.Follow.findAndCount(query);

    ctx.body = {data: result};
};

/**
 * get /follower/request
 * @param ctx
 */
const getFollowRequests = async function (ctx) {

    const query = QueryFilterService.parseAll(ctx, models.Follow);

    query.where = {
        followingId: ctx.state.user.id,
        status: models.Follow.statuses.PENDING
    };

    const result = await models.Follow.findAndCount(query);

    ctx.body = {data: result};
};

/**
 * put /follower/request/:id/:status
 * @param ctx
 */
const processFollowRequest = async function (ctx) {

    const followRequest = ctx.state.follow;

    if (followRequest.status != models.Follow.statuses.PENDING) {throw new AppError(404, "Request not found") }

    switch (_.toLower(ctx.params.action)) {
        case 'accept' :
            followRequest.status = models.Follow.statuses.ACCEPTED;
            break;
        case 'reject' :
            followRequest.status = models.Follow.statuses.REJECTED;
            break;
        default:
            throw new AppError(400, "Unknown action name '" + ctx.params.action + "'.")
    }

    const result = await followRequest.save();

    if (result.isAccepted() && ctx.state.account.enableNotification && ctx.state.account.emailVerified) {
        // If notifications disabled no token should be created in db
        await NotificationService.sendEmailTemplateUserFollow(ctx, 'followed');
    }

    ctx.body = {data: result};
};

/**
 * post /user/:id/follow
 * @param ctx
 */
const createFollowRequest = async function (ctx) {

    const followerId = ctx.state.user.id;
    const followingId = ctx.params.id;

    let status = models.Follow.statuses.PENDING;

    let mailTemplate = '';

    switch (ctx.state.user.canBeFollowed) {
        case  models.User.followRestrictions.ANYBODY :
            status = models.Follow.statuses.ACCEPTED;
            mailTemplate = 'followed';
            break;
        case  models.User.followRestrictions.ASK_ME :
            status = models.Follow.statuses.PENDING;
            mailTemplate = 'follow_request';
            break;
        case  models.User.followRestrictions.NOBODY :
            throw new AppError(400, "User restricted possibility to follow him.")
    }

    const result = await models.Follow.findOrCreate({
        where: {followerId, followingId},
        defaults: {followerId, followingId, status}
    });

    await EventService.create.followedUser(result[0].toJSON());

    if (!_.isEmpty(mailTemplate) && ctx.state.account.enableNotification && ctx.state.account.emailVerified) {
        // If notifications disabled no token should be created in db
        await NotificationService.sendEmailTemplateUserFollow(ctx, mailTemplate);
    }

    ctx.body = {data: result};
};

/**
 * delete /user/:id/follow
 * @param ctx
 */
const dropFollowRequest = async function (ctx) {

    const followerId = ctx.state.user.id;
    const followingId = ctx.params.id;

    const result = await models.Follow.destroy({where: {followerId, followingId}});

    ctx.body = {data: result};
};

/**
 * post /beam/:id/follow
 * @param ctx
 */
const createBeamFollowRequest = async function (ctx) {

    const userId = ctx.state.user.id;
    const beamId = ctx.params.id;
    const beamOwner = await models.User.findOne({where:{id:ctx.state.beam.userId}});

    const result = await models.BeamFollow.findOrCreate({
        where: {userId, beamId},
        defaults: {userId, beamId}
    });

    if (beamOwner && beamOwner.enableNotification && beamOwner.emailVerified) {
        // If notifications disabled no token should be created in db
        await NotificationService.sendEmailTemplateBeamFollow(ctx, beamOwner);
    }

    await EventService.create.followedBeam(result[0].toJSON());

    ctx.body = {data: result};
};

/**
 * delete /beam/:id/follow
 * @param ctx
 */
const dropBeamFollowRequest = async function (ctx) {

    const userId = ctx.state.user.id;
    const beamId = ctx.params.id;

    const result = await models.BeamFollow.destroy({where: {userId, beamId}});

    ctx.body = {data: result};
};


export default {
    getFollowers,
    getFollowings,
    getFollowRequests,
    createFollowRequest,
    dropFollowRequest,
    createBeamFollowRequest,
    dropBeamFollowRequest,
    processFollowRequest
};