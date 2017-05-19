'use strict';

import logger from '../config/logger';
import models from './index';
import * as Bluebird from "bluebird";
import * as _ from 'lodash';

export default function (sequelize, DataTypes) {

    const providers = {
        FACEBOOK: 'facebook',
        TWITTER: 'twitter',
        INSTAGRAM: 'instagram',
    };

    /**
     * List of fields
     * @type {{title: {type: any}, url: {type: any}, tags: {type: any}}}
     */
    const fields = {
        userId: {
            type: DataTypes.INTEGER,
        },
        authId: {
            type: DataTypes.STRING,
        },
        token: {
            type: DataTypes.STRING,
        },
        provider: {
            type: DataTypes.STRING,
        },

    };

    const instanceMethods = {};

    const relations = {};

    /**
     * Validation schema.
     * @type {{type: string, properties: {title: {type: string}, url: {type: string}, tags: {type: string, items: {type: string}}}, additionalProperties: boolean, required: string[]}}
     */
    const schema = {
        type: 'object',
        properties: {
            authId: {type: 'string'},
            token: {type: 'string'},
            provider: {enum: _.values(providers)}
        },
        additionalProperties: false,
        required: ['externalId','token','provider']
    };

    /**
     * Options
     * @type {{instanceMethods: {}, hooks: {afterCreate: (function(any, any): Promise<any>)}, timestamps: boolean, freezeTableName: boolean, classMethods: {relations: {}, schema: {type: string, properties: {title: {type: string}, url: {type: string}, tags: {type: string, items: {type: string}}}, additionalProperties: boolean, required: string[]}}}}
     */
    const options = {
        instanceMethods,
        timestamps: true,
        freezeTableName: true,
        classMethods: {
            relations,
            schema,
            providers,
            associate(models) {

                // relation to User
                models.UserAuth.belongsTo(models.User, {as: 'user'});
                models.User.hasMany(models.UserAuth, {as: 'auth'});
            },
        }
    };

    return sequelize.define('user_auth', fields, options)
}
