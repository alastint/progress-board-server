'use strict';

import logger from '../config/logger';
import config from '../config/app';
import * as uuid from 'uuid';
import * as _ from 'lodash';
import models from "./index";
import * as Bluebird from "bluebird";

export default function (sequelize, DataTypes) {

    const types = {
        REFRESH_TOKEN: 'refresh_token',
        RESET_PASSWORD_TOKEN: 'reset_password_token',
        SIGNUP_CONFIRMATION_TOKEN: 'confirmation_token',
        NOTIFICATION_DISABLE_TOKEN: 'notification_disable_token'
    };
    const fields = {
        userId: {
            type: DataTypes.INTEGER
        },
        type: {
            type: DataTypes.STRING,
        },
        value: {
            type: DataTypes.STRING
            //defaultValue: uuid.v4()
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date(Date.now() + (3600 * 1000)) // default: 1 hour
        }
    };

    const indexes = [
        {unique: true, fields: ['value', 'userId']}
    ];

    const instanceMethods = {};

    /**
     * List of hooks
     * @type {{beforeCreate: ((instance, options, next)=>Promise<any>)}}
     */
    const hooks = {
        beforeCreate: async function (instance, options) {
            logger.info('beforeCreate');

            instance.value = uuid.v4();

            return new Bluebird(function (resolve, reject) {
                resolve(instance)
            })
        },
    };

    const options = {
        indexes,
        instanceMethods,
        hooks,
        timestamps: true,
        freezeTableName: true,
        classMethods: {
            associate(models) {
                // relation to User
                models.Token.belongsTo(models.User, {
                    as: 'user',
                    foreignKey: "userId"
                });
                models.User.hasMany(models.Token, {as: 'tokens'});
            },
            types
        }
    };

    return sequelize.define('token', fields, options)
}