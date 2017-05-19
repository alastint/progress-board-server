'use strict';

import * as _ from 'lodash';
import config from '../../config/app';
import models from '../../models';
import SNSService from '../services/SNSService';
import TokenService from '../services/TokenService';
import EmailService from '../services/EmailService';
import Utils from '../services/Utils';

/**
 * Sending email notification to user
 * that someone followed this user
 * or made follow request
 * @param ctx
 * @param mailTemplate
 */
const sendEmailTemplateUserFollow = async function (ctx, mailTemplate) {
    const notificationDisableToken = await TokenService.createNotificationDisableToken(ctx.state.account);
    await EmailService.sendTemplate(mailTemplate, [ctx.state.account.email], {
        name: ctx.state.account.firstName || ctx.state.account.username,
        followerName: ctx.state.user.firstName || ctx.state.user.username,
        link: Utils.getNotificationDisableLink(notificationDisableToken)
    });
};

/**
 * Sending email notification to user
 * that someone followed this user beam
 * @param ctx
 * @param beamOwner
 */
const sendEmailTemplateBeamFollow = async function (ctx, beamOwner) {
    const notificationDisableToken = await TokenService.createNotificationDisableToken(beamOwner);
    await EmailService.sendTemplate('followed_beam', [beamOwner.email], {
        name: beamOwner.firstName || beamOwner.username,
        followerName: ctx.state.user.firstName || ctx.state.user.username,
        beamDescription: ctx.state.beam.title || ctx.state.beam.description,
        link: Utils.getNotificationDisableLink(notificationDisableToken)
    });
};

/**
 * Sending email for resetting user password
 * @param user
 */
const sendResetPasswordEmail = async function (user) {
    const resetPasswordToken = await TokenService.createResetPasswordToken(user);
    await EmailService.sendTemplate('reset', [user.email], {
        name: user.fullname || 'user',
        link: Utils.getResetLink(resetPasswordToken)
    });
};

/**
 * Sending email for confirmation user email
 * @param created
 */
const sendConfirmationEmail = async function (created) {
    const confirmToken = await TokenService.createConfirmationToken(created);
    await EmailService.sendTemplate('confirmation', [created.email], {
        name: created.fullname || 'user',
        link: Utils.getConfirmLink(confirmToken)
    });
};

/**
 * Wrapper for method send push notification to user devices.
 * @param message
 * @param users
 * @returns {Promise<*>}
 */
const sendPushNotifications = async function (message, users) {
    const devices = await models.MobileDevice.findAll({where: {userId: {$in: users}}});
    return SNSService.send(message, devices);
};

export default {
    sendConfirmationEmail,
    sendEmailTemplateUserFollow,
    sendEmailTemplateBeamFollow,
    sendResetPasswordEmail,
    sendPushNotifications
};
