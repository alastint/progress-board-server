'use strict';

import config from '../../config/app';
import * as _ from 'lodash';
import AppError from './AppError';
import AWS from './AWSService';
import * as Bluebird from "bluebird";
import logger from "../../config/logger";
import models from "../../models";

const sns = new AWS.SNS({apiVersion: '2010-03-31'});



const sendToIOS = async function (message, endpointArn) {

    let payload:any = {
        default: message,
        APNS: {
            aps: {
                alert: message,
                sound: 'default',
                badge: 1
            }
        }
    };

    // first have to stringify the inner APNS object...
    payload.APNS = JSON.stringify(payload.APNS);

    // then have to stringify the entire message payload
    payload = JSON.stringify(payload);

    return new Bluebird(function (resolve, reject) {
        sns.publish({
            Message: payload,
            MessageStructure: 'json',
            TargetArn: endpointArn
        }, function (err, data) {
            if (err) {return reject(err)}

            resolve(data);
        });
    });
};

const addDevice = async function (deviceInstance) {

    const platforms = models.MobileDevice.platforms;
    let arn = '';

    if(deviceInstance.platform == platforms.IOS) {
        if (!config.sns.platformArn.ios) {
            logger.warn('Platform ARN endpoint IOS is not defined');
            return;
        }
        arn = config.sns.platformArn.ios;
    } else if(deviceInstance.platform == platforms.ANDROID) {
        if (!config.sns.platformArn.android) {
            logger.warn('Platform ARN endpoint ANDROID is not defined');
            return;
        }
        arn = config.sns.platformArn.android;
    }

    return new Bluebird(function (resolve, reject) {
        const params = {
            PlatformApplicationArn: arn,
            Token: deviceInstance.token
        };
        sns.createPlatformEndpoint(params, function (err, data) {
            if (err) { return reject(err) }

            logger.verbose(`Created endpoint for mobile device ID:${deviceInstance.id}`);

            resolve(data.EndpointArn);
        })
    });
};

const send = async function (message, deviceInstances) {

    const platforms = models.MobileDevice.platforms;

    let list = _.isArray(deviceInstances)
        ? deviceInstances
        : [deviceInstances];

    const result = {};
    for (var i in deviceInstances) {

        if (deviceInstances[i].platform == platforms.IOS) {
            const endpointArn = deviceInstances[i].endpointArn;

            if (!endpointArn) {
                logger.warn(`Mobile device ID=${deviceInstances[i].id} doesn't have endpointArn`);
                continue;
            }

            result[deviceInstances[i].id] = await sendToIOS(message, endpointArn);
        }

        // TODO implement sending pushes to ANDROID
    }

    return result;
};


export default {
    send: async function(message, deviceInstances){
        let result:any = {}
        try {
            result = await send(message, deviceInstances);
        } catch (e) {
            logger.error(e)
        }
        return result
    },
    addDevice
};