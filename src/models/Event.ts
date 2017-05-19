'use strict';

import logger from '../config/logger';
import config from '../config/app';
import Utils from '../api/services/Utils';
import * as uuid from 'uuid';
import * as _ from 'lodash';
import * as Bluebird from "bluebird";
import {types} from "pg";

export default function (sequelize, DataTypes) {

    const types = {
        USER_FOLLOW: 'user_follow',
        POST_CREATE: 'post_create',
        SYNCH: 'synch'
    };

    const fields = {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        targetId: {
            type: DataTypes.INTEGER
        },
        title: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        }
    };

    const schema = {
        type: 'object',
        properties: {
            userId: {type: 'integer'},
            targetId: {type: 'integer'},
            title: {type: 'string'},
            type: {enum: _.chain(types).values().value()},
        },
        additionalProperties: false,
        required: ['userId', 'type']
    };

    const instanceMethods = {};

    /**
     * Relations for query filter service.
     * @type {{user: {model: string}}}
     */
    const relations = {
        user: {model: 'User'}
    };

    const scopes = {
        skipBlocked: (userId) => {
            return {
                where: {
                    $and: {
                        userId: {$notIn: sequelize.literal(`(SELECT "b"."accusedUserId" FROM "user_black_list" as "b" WHERE "b"."userId" = ${userId})`)},
                        $or: [
                            {
                                type: types.POST_CREATE,
                                targetId: {
                                    $notIn: sequelize.literal(`(SELECT "p"."id" FROM "beam_black_list" as "b"
                                    JOIN "post" AS "p" ON "b"."beamId" = ANY ("p"."beamId") WHERE "b"."userId" = ${userId})`)
                                }
                            }
                        ]
                    }
                }
            }
        },
        followingsOf: function (userId) {
            return {
                where: {
                    $or: [
                        {userId: {$in: sequelize.literal(`(SELECT "f"."followingId" FROM "follow" as "f" WHERE "f"."followerId" = ${userId})`)}},
                        {userId}
                    ]
                }
            }
        },
        fromId: function (id) {
            return {
                where: {
                    id: {$gt: _.toInteger(id)}
                }
            }
        },
        includeAll: function (user, models) {
            // include different instances depend event type
            return {
                order: '"event"."createdAt" DESC',
                include: [
                    {
                        model: models.User,
                        as: 'user',
                        attributes: ['id', 'username', 'email', 'pictureName']
                    },
                    {
                        model: models.User,
                        as: 'following',
                        on: sequelize.literal(`"event"."type" = '${types.USER_FOLLOW}' AND "event"."targetId" = "following"."id"`),
                        attributes: ['id', 'username', 'email', 'pictureName']
                    },
                    {
                        model: models.Post,
                        as: 'post',
                        on: sequelize.literal(`"event"."type" = '${types.POST_CREATE}' AND "event"."targetId" = "post"."id"`),
                        include: [
                            {
                                model: models.Beam,
                                as: 'beams',
                                on: sequelize.literal('"post.beams"."id" = ANY("post"."beamId")'),
                                attributes: {include: Utils.mapAnyRows(models.Beam.extraFields("post.beams"), {state:{user}})}
                            },
                        ]
                    },

                ]
            };
        }
    };

    const options = {
        instanceMethods,
        timestamps: true,
        freezeTableName: true,
        paranoid: true,
        scopes,
        classMethods: {
            types,
            schema,
            relations,
            associate(models) {
                // relation to User
                models.Event.belongsTo(models.User);
                models.Event.belongsTo(models.User, {foreignKey: 'targetId', as: 'following'});
            }
        }
    };

    return sequelize.define('event', fields, options)
}