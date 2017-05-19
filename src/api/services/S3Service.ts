'use strict';

import config from '../../config/app';
import * as _ from 'lodash';
import AppError from './AppError';
import AWS from './AWSService';
import * as Bluebird from "bluebird";

const s3 = new AWS.S3({
    signatureVersion: 'v4',
    // signatureCache: true
});

// key links to folders on S3 bucket
const types = {
    BEAM: config.s3.folders.beam,
    USER: config.s3.folders.user
};

const ACLs = {
    PUBLIC: 'private',
    PUBLIC_READ: 'public-read',
    PUBLIC_READ_WRITE: 'public-read-write',
    AUTHENTICATED_READ: 'authenticated-read',
};

const createKey = (folder, userId, pictureName = "image") => {
    return `${folder}/${userId}/${pictureName}`
};

const convertUrlToObject = (url) => {
    const [link, signature] = _.split(url, '?');
    return {link, signature};
};


const createUploadUrl = function (folder, id, pictureName = "image") {
    const url = s3.getSignedUrl('putObject', {
        Bucket: config.s3.bucket,
        Key: createKey(folder, id, pictureName),
        Expires: config.s3.urlExpiresIn
    });

    return _.set(convertUrlToObject(url), 'name', pictureName);
};

const createDownloadUrl = function (folder, id, pictureName = "image") {
    if (/^http/.test(pictureName)) {return convertUrlToObject(pictureName + '?')}

    const url = s3.getSignedUrl('getObject', {
        Bucket: config.s3.bucket,
        Key: createKey(folder, id, pictureName),
        Expires: config.s3.urlExpiresIn
    });

    return convertUrlToObject(url)
};

const getHeadObject = async function (folder, id, pictureName = "image") {
    return new Bluebird(function (resolve, reject) {
        s3.headObject({Bucket: config.s3.bucket, Key: createKey(folder, id, pictureName)}, function (err, data) {
            if (err) { return reject(err) }
            resolve(data);
        });
    })
};


export default {
    types,
    createUploadUrl,
    createDownloadUrl,
    getHeadObject
};