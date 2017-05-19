'use strict';

import logger from '../config/logger';
import config from '../config/app';
import * as uuid from 'uuid';
import * as _ from 'lodash';
import * as Bluebird from "bluebird";

export default function (sequelize, DataTypes) {

    const statuses = {
        PENDING: 'pending',
        ACCEPTED: 'accepted',
        REJECTED: 'rejected'
    };

    const fields = {
        followerId: {
            type: DataTypes.INTEGER
        },
        followingId: {
            type: DataTypes.INTEGER
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: statuses.PENDING
        }
    };

    const schema = {
        type: 'object',
        properties: {
            followerId: {type: 'integer'},
            followingId: {type: 'integer'},
            status: {enum: _.chain(statuses).values().push("").value()},
        },
        additionalProperties: false,
        required: ['followerId', 'followingId']
    };


    const instanceMethods = {
        isAccepted : function(){
            return this.status === statuses.ACCEPTED
        }
    };

    /**
     * Relations for query filter service.
     * @type {{user: {model: string}}}
     */
    const relations = {
        follower: {model: 'User'},
        following: {model: 'User'},
    };

    const hooks = {
        afterCreate: async function (instance, options) {
            logger.info('afterCreate');

            return new Bluebird(function (resolve, reject) {
                resolve(instance)
            });
        },
    };

    const options = {
        hooks,
        instanceMethods,
        timestamps: true,
        freezeTableName: true,
        classMethods: {
            statuses,
            schema,
            relations,
            associate(models) {
                // relation to User
                models.Follow.belongsTo(models.User, {as: 'follower', foreignKey: "followerId"});
                models.Follow.belongsTo(models.User, {as: 'following', foreignKey: "followingId"});
                models.User.hasMany(models.Follow, {as: 'followers', foreignKey: "followingId"});
                models.User.hasMany(models.Follow, {as: 'followings', foreignKey: "followerId"});
            }
        }
    };

    return sequelize.define('follow', fields, options)
}