'use strict';

import logger from '../config/logger';
import config from '../config/app';
import * as moment from 'moment';
import * as _ from 'lodash';
import * as slug from 'slug';
import models from './index';
import S3Service from '../api/services/S3Service';
import RoleService from '../api/services/RoleService';
import * as Bluebird from "bluebird";

export default function (sequelize, DataTypes) {

    /**
     * List of available ProgressBoard types
     * @type {{LIBRARY: string; PUBLIC: string; PRIVATE: string}}
     */
    const types = {
        LIBRARY: 'library', // means, that user can save it
        PUBLIC: 'public',
        PRIVATE: 'private'
    };

    /**
     * List of available ProgressBoard statuses
     * @type {{ENABLED: string; DISABLED: string}}
     */
    const statuses = {
        UPLOADING: 'uploading',
        ENABLED: 'enabled',
        DISABLED: 'disabled',
        BANNED: 'banned'
    };

  /**
   * List of fields
   * @type {{userId: {type: any}, status: {type: any, defaultValue: string, enum: any}, title: {type: any}, description: {type: any}, properties: {type: any}, linkUrl: {type: any}, skills: {type: any}}}
   */
  const fields = {
        userId: {
            type: DataTypes.INTEGER,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: statuses.ENABLED,
            enum: _.values(statuses)
        },
        title: {
            type: DataTypes.STRING,
        },
        description: {
            type: DataTypes.STRING,
        },
        properties: {
            type: DataTypes.JSON,
        },
        linkUrl: {
            type: DataTypes.STRING,
        },
        skills: {
            type: DataTypes.ARRAY(DataTypes.INTEGER)
        }
    };

    /**
     * Index
     * @type {{unique: boolean; fields: string[]}[]}
     */
    const indexes = [];

    /**
     * List of hooks
     * @type {{afterCreate: ((instance, options, next)=>Promise<any>)}}
     */
    const hooks = {
        afterCreate: async function (instance, options) {
            logger.info('afterCreate');

            if (_.size(instance.skills) > 0) {
                await models.Tag.createOrIncrement(instance.skills)
            }

            return new Bluebird(function (resolve, reject) {
                resolve(instance)
            })
        },
    };

    /**
     * Scopes.
     * @type {{onlyPublic: (()=>{where: {type: string}})}}
     */
    const scopes = {
        onlyPublic: () => {
            return {where: {type: types.PUBLIC}}
        },
        causes: {
            where: {
                userId: {
                    $in: sequelize.literal(`(SELECT "u"."id" FROM "user" as "u" WHERE "u"."type" = 'trusted')`)
                },
            }
        },
        saved: (userId) => {
            return {
                where: {
                    id: {
                        $in: sequelize.literal(`(SELECT "s"."beamId" FROM "saved_beam" as "s" WHERE "s"."userId" = ${userId})`)
                    },
                }
            }
        },
        created: (userId) => {
            return {where: {userId}}
        },
        skipBlocked: (userId) => {
            return {
                where: {
                    id: { $notIn: sequelize.literal(`(SELECT "b"."beamId" FROM "beam_black_list" as "b" WHERE "b"."userId" = ${userId})`)},
                    userId: { $notIn: sequelize.literal(`(SELECT "b"."accusedUserId" FROM "user_black_list" as "b" WHERE "b"."userId" = ${userId})`)}
                }
            }
        },
        blocked: (userId) => {
            return {
                where: {
                    id: { $in: sequelize.literal(`(SELECT "b"."beamId" FROM "beam_black_list" as "b" WHERE "b"."userId" = ${userId})`)},
                    userId: { $notIn: sequelize.literal(`(SELECT "b"."accusedUserId" FROM "user_black_list" as "b" WHERE "b"."userId" = ${userId})`)}
                }
            }
        },
        all: (userId) => {
            return {
                where: {
                    $or: [
                        {userId},
                        {id: {$in: sequelize.literal(`(SELECT "s"."beamId" FROM "saved_beam" as "s" WHERE "s"."userId" = ${userId})`)}},
                        {
                            skills: {
                                $overlap: sequelize.literal(`(
                                    SELECT array_agg(skills) skills
                                    FROM (
                                        SELECT unnest(array_cat("i".skills, "a".skills))
                                        FROM "user" "u" 
                                        LEFT JOIN "interest" "i" ON "i"."id" = ANY ("u"."interestId")
                                        WHERE "u"."id" = ${userId}
                                    ) AS dt(skills)
                                )`)
                            }
                        }
                    ]
                }
            }
        }
    };

    /**
     * Instance methods.
     * @type {{createUploadUrl: (()=>string)}}
     */
    const instanceMethods = {};

    /**
     * Relations for query filter service.
     * @type {{user: {model: string}}}
     */
    const relations = {
        user: {model: 'User'}
    };

  /**
   * Validation schema.
   * @type {{type: string, properties: {userId: {type: string}, type: {type: string}, status: {type: string}, title: {type: string}, assetUrl: {type: string}, linkUrl: {type: string}, description: {type: string}, skills: {type: string, items: {type: string}}, imageName: {type: string}, categoryId: {type: string, items: {type: string}}, isInstagram: {type: string}, isFacebook: {type: string}, isTwitter: {type: string}}, additionalProperties: boolean, required: string[]}}
   */
  const schema = {
        type: 'object',
        properties: {
            userId: {type: 'integer'},
            type: {type: 'string'},
            status: {type: 'string'},
            title: {type: 'string'},
            assetUrl: {type: 'string'},
            linkUrl: {type: 'string'},
            description: {type: 'string'},
            skills: {
                type: 'array',
                items: {type: "integer"},
            },
            imageName: {type: 'string'},
            categoryId: {
                type: 'array',
                items: {type: "integer"}
            },
            isInstagram: {type: 'boolean'},
            isFacebook: {type: 'boolean'},
            isTwitter: {type: 'boolean'}
        },
        additionalProperties: false,
        required: ['title', 'userId']
    };

    /**
     * Groupes options.
     * @type {{indexes: Array, hooks: {afterCreate: (function(any, any): Promise<any>)}, scopes: {onlyPublic: (function(): {where: {type: string}}), causes: {where: {userId: {$in: any}}}, saved: (function(any): {where: {id: {$in: any}}}), created: (function(any): {where: {userId: any}}), skipBlocked: (function(any): {where: {id: {$notIn: any}, userId: {$notIn: any}}}), blocked: (function(any): {where: {id: {$in: any}, userId: {$notIn: any}}}), all: (function(any): {where: {$or: {userId: any}|{id: {$in: any}}|{skills: {$overlap: any}}[]}})}, instanceMethods: {}, timestamps: boolean, freezeTableName: boolean, paranoid: boolean, classMethods: {types: {LIBRARY: string, PUBLIC: string, PRIVATE: string}, statuses: {UPLOADING: string, ENABLED: string, DISABLED: string, BANNED: string}, relations: {user: {model: string}}, schema: {type: string, properties: {userId: {type: string}, type: {type: string}, status: {type: string}, title: {type: string}, assetUrl: {type: string}, linkUrl: {type: string}, description: {type: string}, skills: {type: string, items: {type: string}}, imageName: {type: string}, categoryId: {type: string, items: {type: string}}, isInstagram: {type: string}, isFacebook: {type: string}, isTwitter: {type: string}}, additionalProperties: boolean, required: string[]}, associate: (function(any): undefined)}}}
     */
  const options = {
        indexes,
        hooks,
        scopes,
        instanceMethods,
        timestamps: true,
        freezeTableName: true,
        paranoid: true,
        classMethods: {
            types,
            statuses,
            relations,
            schema,
            associate(models) {
                // relation to User
                models.ProgressBoard.belongsTo(models.User, {as: 'user', foreignKey: "userId"});

                // relation to Skill
                models.ProgressBoard.hasMany(models.Skill, {as: 'skill', foreignKey: "id"});
            }
        }
    };

    return sequelize.define('progress_board', fields, options)
}