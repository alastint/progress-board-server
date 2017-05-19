'use strict';

import * as _ from 'lodash';
import config from '../../config/app';
import models from '../../models';
import NotificationService from '../services/NotificationService';

const textTruncate = (text:string) => {
    if (_.isEmpty(text)) { return ''; }
    return text.slice(0, 24) + (text.length > 24 ? '...' : '')
};

const createdPost = async function (post) {

    const postUser = await models.User.findOne({where: {id: post.userId}});

    const event = models.Event.create({
        userId: post.userId,
        targetId: post.id,
        title: `${postUser.fullname} published new post "${textTruncate(post.title || post.description)}"`,
        type: models.Event.types.POST_CREATE
    });

    const followers = await models.Follow.findAll({where: {followingId: post.userId}, attributes: ['followerId']});

    await NotificationService.sendPushNotifications(`${postUser.fullname} published new post`, _.map(followers, 'followerId'));

    return event;
};

const likedBeam = async function (beamLike) {

    const followerUser = await models.User.findOne({where: {id: beamLike.userId}});
    const followingBeam = await models.Beam.findOne({where: {id: beamLike.id}});

    const event = models.Event.create({
        userId: beamLike.userId,
        targetId: beamLike.id,
        title: `${followerUser.fullname} liked beam "${textTruncate(followingBeam.title || followingBeam.description)}"`,
        type: models.Event.types.BEAM_LIKE
    });

    await NotificationService.sendPushNotifications(`${followerUser.fullname} liked your beam`, [followingBeam.userId]);

    return event;
};

const followedUser = async function (follow) {

    const followUsers: any = await models.User.findAll({where: {$or: [{id: follow.followerId},{id: follow.followingId}]}});
    const followerUser: any = _.find(followUsers, ['id', follow.followerId]);
    const followingUser: any = _.find(followUsers, ['id', follow.followingId]);

    const event = models.Event.create({
        userId: follow.followerId,
        targetId: follow.followingId,
        title: `${followerUser.fullname} followed user "${followingUser.fullname}"`,
        type: models.Event.types.USER_FOLLOW
    });

    await NotificationService.sendPushNotifications(`${followerUser.fullname} is following you`, [follow.followingId]);

    return event;
};

const followedBeam = async function (follow) {

    const followerUser = await models.User.findOne({where: {id: follow.userId}});
    const followingBeam = await models.Beam.findOne({where: {id: follow.beamId}});

    const event = models.Event.create({
        userId: follow.userId,
        targetId: follow.beamId,
        title: `${followerUser.email} followed beam "${textTruncate(followingBeam.title || followingBeam.description)}"`,
        type: models.Event.types.BEAM_FOLLOW
    });

    await NotificationService.sendPushNotifications(`${followerUser.fullname} followed your beam`, [followingBeam.userId]);

    return event;
};

export default {
    create: {
        createdPost,
        likedBeam,
        followedBeam,
        followedUser
    }
};