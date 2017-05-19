'use strict';

import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as Bluebird from 'bluebird';
import config from '../../config/app';
import AppError from './AppError';

/**
 * Generate a hash from plain password
 * @param password
 */
const hashPassword = async function (password) {
    return new Bluebird(function (resolve, reject) {
        bcrypt.genSalt(config.saltFactor, function (err, salt) {
            if (err) return reject(err);

            bcrypt.hash(password, salt, function (err, hash) {
                if (err) return reject(err);
                return resolve(hash);
            });
        });
    });
};

/**
 * Compare a password provided from user and real current password hash
 * @param password
 * @param passwordHash
 */
const comparePasswords = async function (password, passwordHash) {
    return new Bluebird(function (resolve, reject) {
        bcrypt.compare(password, passwordHash, function (err, valid) {
            if (err) return reject(err);
            return resolve(valid);
        });
    });
};

const signToken = function (data, secret = config.jwt.secret, options = {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer
}) {
    return jwt.sign(data, secret, options);
};

const verifyToken = async function (token, secret = config.jwt.secret) {
    return new Bluebird(function (resolve, reject) {
        jwt.verify(token, secret, function (err, decoded) {

            if (err && err.name === 'TokenExpiredError') {
                return reject(new AppError(401, 'Token is expired'));
            }

            if ((err && err.name === 'JsonWebTokenError') || !decoded) {
                return reject(new AppError(401, 'Token is not valid'));
            }

            return resolve(decoded);
        });
    });
};

export default {
    comparePasswords,
    hashPassword,
    signToken,
    verifyToken
};