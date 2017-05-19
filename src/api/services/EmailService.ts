'use strict';

import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as path from 'path';
import {EmailTemplate} from 'email-templates';
import config from '../../config/app';
import models from '../../models';
import logger from '../../config/logger';
import aws from './AWSService';

const templatesDir = path.join(__dirname, '..', 'templates');
const prefix = '[EMAIL]';
const stage = getAppStageForDisplay();
const ses = new aws.SES({apiVersion: '2010-12-01'});

const templatesMeta = {
    'reset': {
        file: 'reset',
        subject: `${config.name} ${stage} Password reset`
    },
    'alert': {
        file: 'alert',
        subject: `${config.name} ${stage} Alert`
    },
    'user_block': {
        file: 'alert',
        subject: `${config.name} ${stage} Blocked user`
    },
    'beam_block': {
        file: 'alert',
        subject: `${config.name} ${stage} Blocked beam`
    },
    'confirmation': {
        file: 'confirmation',
        subject: `${config.name} ${stage} Confirm signup`
    },
    'follow_request': {
        file: 'follow_request',
        subject: `${config.name} ${stage} Following request`
    },
    'followed': {
        file: 'followed',
        subject: `${config.name} ${stage} You have new followers`
    },
    'followed_beam': {
        file: 'followed_beam',
        subject: `${config.name} ${stage} You have new beam followers`
    },
    'notification_disable': {
        file: 'notification_disable',
        subject: `${config.name} ${stage} Disable notifications`
    },
    'partner_request': {
        file: 'partner_request',
        subject: `${config.name} ${stage} Partner request`
    },
    'publisher_request_result': {
        file: 'publisher_request_result',
        subject: `${config.name} ${stage} Partner request is processed`
    },
    'subscription_request': {
        file: 'subscription_request',
        subject: `${config.name} ${stage} Subscription request`
    },
};

function getAppStageForDisplay() {
    switch (config.stage) {
        case 'master':
            return '';
        default:
            return `[${config.stage}]`;
    }
}

function getMeta(name) {
    let meta = templatesMeta[name];
    if (_.isUndefined(meta))
        throw new Error(`${prefix} Template "${name}" is not defined!`);
    else
        return meta;
}

const filterEmails = async function (emails) {

    const blacklist = await models.EmailBlacklist.findAll({where: {email: {$in : emails}}});

    if(_.size(blacklist) == 0) { return emails }

    const blacklistEmail = _.map(blacklist, 'email');

    logger.warn('Avoid to send messages to emails which are in blacklist : ' + _.join(blacklistEmail,', '));

    return _.difference(emails, blacklistEmail);
};

/**
 * Send email via AWS SES.
 * @param options
 */
const send = async function (options) {

    const toEmails = await filterEmails(options.to);

    return new Bluebird(function (resolve, reject) {

        if(_.size(toEmails)== 0){ return reject("List of recepient emails is empty.") }

        if(!config.email.live) {
            logger.info('Skipped sending mails, because its not LIVE MODE');
            return resolve();
        }

        ses.sendEmail({
            Source: config.email.from,
            Destination: {ToAddresses: toEmails},
            Message: {
                Subject: {Data: options.subject},
                Body: {
                    Html: {Data: options.html},
                    Text: {Data: options.text}
                }
            }
        }, function (err, data) {
            if (err) { return reject(err) }
            logger.info(`${prefix} "${options.subject}" sent to user ${options.to} | ${data}`);
            resolve(data);
        })
    });
};


/**
 * Send email with predefined template
 * @param templateName
 * @param to
 * @param data
 */
const sendTemplate = async function (templateName, to, data) {

    let meta = getMeta(templateName);

    const message:any = await renderTemplate(meta.file, data);

    let result:any={};
    try {
        result = await send({
            to: to,
            subject: meta.subject,
            text: message.text,
            html: message.html
        });
    } catch (e) {
        logger.error(e);
    }

    return result;
};

/**
 * Send email with predefined template
 * @param templateDir
 * @param data
 */
const renderTemplate = async function (templateDir, data) {

    const mail = new EmailTemplate(templatesDir + '/' + templateDir);

    data.appName = data.appName || config.name;
    data.stage = data.stage || stage;
    data.frontendHost = config.frontendHost;

    return new Bluebird((resolve, reject) => {
        mail.render(data, function (err, result) {
            if (err) { return reject(err) }

            resolve(result)
        });
    });

};

export default {
    send,
    sendTemplate
};