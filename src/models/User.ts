'use strict';

import logger from '../config/logger';
import AppError from '../api/services/AppError';
import AuthService from '../api/services/AuthService';
import {roles} from '../api/services/RoleService';
import RoleService from '../api/services/RoleService';
import S3Service from '../api/services/S3Service';
import * as _ from 'lodash';
import * as slug from 'slug';
import * as Bluebird from "bluebird";

export default function (sequelize, DataTypes) {

    /**
     * Available statuses.
     *
     * @type {{ENABLED: string; DISABLED: string}}
     */
    const statuses = {
        NEW: 'new',
        ENABLED: 'enabled',
        DISABLED: 'disabled'
    };

    const genders = {
        ORG: 'org',
        MALE: 'male',
        FEMALE: 'female'
    };

    const types = {
        NORMAL: 'normal',
        TRUSTED: 'trusted'
    };

    const followRestrictions = {
        ANYBODY: 'anybody',
        ASK_ME: 'ask_me',
        NOBODY: 'nobody',
    };

    /**
     * Defined fields.
     */
    const fields = {
        firstName: {
            type: DataTypes.STRING
        },
        lastName: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true,
                notEmpty: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            private: true
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: roles.USER,
            enum: _.values(roles),
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: types.NORMAL,
            enum: _.values(types),
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: statuses.NEW,
            enum: _.values(statuses)
        },
        lastQuestionAnswerId: {
            type: DataTypes.INTEGER,
        },
        description: {
            type: DataTypes.STRING
        },
        gender: {
            type: DataTypes.STRING
        },
        dob: {
            type: DataTypes.DATE
        }
        //authId: {
        //    type: DataTypes.STRING,
        //},
        // createdAt: {
        //     type: DataTypes.DATE,
        //     allowNull: false,
        //     defaultValue: sequelize.literal('NOW()')
        // },
        // updatedAt: {
        //     type: DataTypes.DATE,
        //     allowNull: false,
        //     defaultValue: sequelize.literal('NOW()')
        // }
    };

    /**
     * Virtual getters methods.
     *
     * @type {{asset: (()=>string)}}
     */
    const getterMethods = {
        fullname: function(){
            return _.trim(((this.firstName || this.lastName) ?
                _.toString(this.firstName) + ' ' + _.toString(this.lastName) : false) ||
                (this.companyName) || (this.email))
        }
    };

    const setterMethods = {};

    /**
     * Indexes.
     *
     * @type {{unique: boolean; fields: string[]}[]}
     */
    const indexes = [
        {unique: true, fields: ['email']},
    ];

    /**
     * List of ORM hooks.
     */
    const hooks = {
        beforeBulkCreate: function (instances, options) {
            logger.info('beforeBulkCreate');

            return new Bluebird(function (resolve, reject) {
                resolve(instances)
            })
        },
        beforeBulkDestroy(options, next) {
            logger.info('beforeBulkDestroy');
            options.where.role = {$ne: 'super'};
            next();
        },
        beforeBulkUpdate(options, next) {
            logger.info('beforeBulkUpdate');
            next();
        },
        beforeValidate(instance, options, next) {
            logger.info('beforeValidate');
            next();
        },
        afterValidate(instance, options, next) {
            logger.info('afterValidate');
            next();
        },
        validationFailed(instance, options, error, next) {
            logger.info('validationFailed', error);
            next();
        },
        beforeCreate: async function (instance, options) {
            logger.info('beforeCreate');

            /** replace plain password with hash */
            instance.password = await AuthService.hashPassword(instance.password);

            return new Bluebird(function (resolve, reject) {
                resolve(instance)
            })
        },
        beforeDestroy(instance, options, next) {
            logger.info('beforeDestroy');

            if (instance.role == 'super') {
                return next("You can not to remove super admin");
            }

            next();
        },
        beforeUpdate: async function (instance, options) {
            if (options.fields.includes('password')) {
                instance.password = await AuthService.hashPassword(instance.password);
            }

            return new Bluebird(function (resolve, reject) {
                resolve(instance)
            })
        },
        beforeSave: async function (instance, options) {
            logger.info('beforeSave');

            if (options.fields.includes('password')) {
                instance.password = await AuthService.hashPassword(instance.password);
            }

            return new Bluebird(function (resolve, reject) {
                resolve(instance)
            })
        },
        beforeUpsert(values, options, next) {
            logger.info('beforeUpsert', values);
            next();
        },
        afterCreate: async function (instance, options) {
            logger.info('afterCreate');

            return new Bluebird(function (resolve, reject) {
                resolve(instance)
            })
        },
        afterDestroy(instance, options, next) {
            logger.info('afterDestroy');
            next();
        },
        afterUpdate(instance, options, next) {
            logger.info('afterUpdate');
            next();
        },
        afterSave(instance, options, next) {
            logger.info('afterSave');
            next();
        },
        afterUpsert(created, options, next) {
            logger.info('afterUpsert');
            next();
        },
        afterBulkCreate: async function (instances, options) {
            logger.info('afterBulkCreate');

            return new Bluebird(function (resolve, reject) {
                resolve(instances)
            })
        },
        afterBulkDestroy(options, next) {
            logger.info('afterBulkDestroy');
            next();
        },
        afterBulkUpdate(options, next) {
            logger.info('afterBulkUpdate');
            next();
        }
    };

    /**
     * Instance methods.
     *
     * @type {{toJSON: (()=>any); isActive: (()=>boolean); createUploadUrl: (()=>any)}}
     */
    const instanceMethods = {
        toJSON: function () {
            let object = this.get();
            delete object.password;
            return object;
        },
        isDisabled: function () {
            return this.status === statuses.DISABLED
        },
        createUploadUrl: function (name) {
            if (!name) { name = slug(`picture-${(new Date()).toISOString()}`)}
            return S3Service.createUploadUrl(S3Service.types.USER, this.id, name);
        },
        isAdmin: function () {
            return RoleService.roleIsAdmin(this.role);
        }
    };

    /**
     * Relations for queryFilterService.
     *
     * @type {{beams: {model: string}; beamDevices: {model: string}}}
     */
    const relations = {
        textRecords: {model: 'TextRecord'},
        messages: {model: 'Message'},
        questionAnswers: {model: 'QuestionAnswer'},
        plans: {model: 'Plan'},
        subscriptions: {model: 'Subscription'},
        followers: {model: 'Follow'},
        followings: {model: 'Follow'}
        // auth: {model: 'UserAuth'}, // #TODO should be hidden for other users
        // categories: {model: 'Category', on: sequelize.literal('"categories"."id" = ANY("user"."categoryId")')}
    };

    //const extraFields = (alias = 'user') => {
    //    return {
    //        followersCount: [sequelize.literal(`(SELECT COUNT("f"."id")::INT FROM "follow" as "f" WHERE "f"."followingId" = "${alias}"."id")`), 'followersCount'],
    //        followingsCount: [sequelize.literal(`(SELECT COUNT("f"."id")::INT FROM "follow" as "f" WHERE "f"."followerId" = "${alias}"."id")`), 'followingsCount'],
    //        createdBeamsCount: [sequelize.literal(`(SELECT COUNT("b"."id")::INT FROM "beam" as "b" WHERE "b"."userId" = "${alias}"."id")`), 'createdBeamsCount'],
    //        savedBeamCount: [sequelize.literal(`(SELECT COUNT("sb"."id")::INT FROM "saved_beam" as "sb" WHERE "sb"."userId" = "${alias}"."id")`), 'savedBeamCount'],
    //        // TODO refactor allBeamsCount query
    //        allBeamsCount: [sequelize.literal(`((SELECT COUNT("b"."id")::INT FROM "beam" as "b" WHERE "b"."userId" = "${alias}"."id") + (SELECT COUNT("sb"."id")::INT FROM "saved_beam" as "sb" WHERE "sb"."userId" = "${alias}"."id"))`), 'allBeamsCount'],
    //        isFollowed: (ctx) => { // shows true or false
    //            return [sequelize.literal(`(SELECT (COUNT("f"."id") > 0) FROM "follow" as "f"
    //            WHERE "f"."followingId" = "${alias}"."id" AND "f"."followerId" = ${_.get(ctx, 'state.user.id', 0)})`), 'isFollowed']
    //        },
    //        blockedUserCount: [sequelize.literal(`(SELECT COUNT("b"."id")::INT FROM "user_black_list" as "b" WHERE "b"."userId" = "${alias}"."id")`), 'blockedUserCount'],
    //        blockedBeamCount: [sequelize.literal(`(SELECT COUNT("b"."id")::INT FROM "beam_black_list" as "b" WHERE "b"."userId" = "${alias}"."id")`), 'blockedBeamCount'],
    //    }
    //};

    /**
     * Validation schema.
     *
     * @type {{type: string; properties: {firstName: {type: string}; lastName: {type: string}; email: {type: string; format: string}; password: {type: string|string[]; minLength: number}; role: {type: string}; status: {type: string}; picture: {type: string}; description: {type: string}; dob: {type: string}}; additionalProperties: boolean; required: string|string[]}}
     */
    const schema = {
        type: 'object',
        properties: {
            firstName: {type: 'string'},
            lastName: {type: 'string'},
            fullName: {type: 'string'},
            companyName: {type: 'string'},
            email: {type: 'string', format: 'email'},
            password: {
                type: ['string', 'integer'],
                minLength: 4
            },
            role: {enum: _.chain(roles).values().push("").value()},
            type: {enum: _.chain(types).values().push("").value()},
            status: {enum: _.chain(statuses).values().push("").value()},
            pictureName: {type: 'string'},
            description: {type: 'string'},
            dob: {type: 'string'},
            enableNotification: {type: 'boolean'},
            gender: {enum: _.chain(genders).values().push("").value()},
            imageUpdatedAt: {type: 'string'},
            categoryId: {
                type: 'array',
                items: {type: "integer"}
            },
            interestId: {
                type: 'array',
                items: {type: "integer"}
            }
        },
        additionalProperties: false,
        required: ['email', 'password']
    };

    const scopes = {
        beamer: (beam) => {
            return {
                where: {
                    $or: [
                        {id: { $in: sequelize.literal(`(SELECT "d"."userId" FROM "beam_device" as "d" WHERE ${beam.id} = ANY("d"."beamId"))`)}},
                        {id: beam.userId},
                    ],
                }
            }
        },
        follower: (userId) => {
            return {
                where: {
                    id: { $in: sequelize.literal(`(SELECT "f"."followingId" FROM "follow" as "f" WHERE "f"."followerId" = ${userId})`)}
                }
            }
        },
        following: (userId) => {
            return {
                where: {
                    id: { $in: sequelize.literal(`(SELECT "f"."followerId" FROM "follow" as "f" WHERE "f"."followingId" = ${userId})`)}
                }
            }
        }
    };

    /**
     * Grouped options for sequenize.
     *
     * @type {{indexes: {unique: boolean; fields: string[]}[]; instanceMethods: {toJSON: (()=>any); isActive: (()=>boolean); createUploadUrl: (()=>(any|Promise<any>|string))}; hooks: {beforeBulkCreate: ((instances, options, next)=>any); beforeBulkDestroy: ((options, next)=>any); beforeBulkUpdate: ((options, next)=>any); beforeValidate: ((instance, options, next)=>any); afterValidate: ((instance, options, next)=>any); validationFailed: ((instance, options, error, next)=>any); beforeCreate: ((instance, options, next)=>Promise<any>); beforeDestroy: ((instance, options, next)=>any); beforeUpdate: ((instance, options, next)=>Promise<any>); beforeSave: ((instance, options, next)=>any); beforeUpsert: ((values, options, next)=>any); afterCreate: ((instance, options, next)=>any); afterDestroy: ((instance, options, next)=>any); afterUpdate: ((instance, options, next)=>any); afterSave: ((instance, options, next)=>any); afterUpsert: ((created, options, next)=>any); afterBulkCreate: ((instances, options, next)=>any); afterBulkDestroy: ((options, next)=>any); afterBulkUpdate: ((options, next)=>any)}; timestamps: boolean; freezeTableName: boolean; classMethods: {schema: {type: string; properties: {firstName: {type: string}; lastName: {type: string}; email: {type: string; format: string}; password: {type: string|string[]; minLength: number}; role: {type: string}; status: {type: string}; picture: {type: string}; description: {type: string}; dob: {type: string}}; additionalProperties: boolean; required: string|string[]}; relations: {beams: {model: string}; beamDevices: {model: string}}; statuses: {ENABLED: string; DISABLED: string}; roles: any}}}
     */
    const options = {
        indexes,
        instanceMethods,
        hooks,
        scopes,
        getterMethods,
        setterMethods,
        timestamps: true,
        freezeTableName: true,
        classMethods: {
            //extraFields,
            schema,
            relations,
            statuses,
            roles,
            types,
            genders,
            followRestrictions,
            associate(models) {
                models.User.hasMany(models.TextRecord, {as: 'textRecords'});
                models.User.hasMany(models.Message, {as: 'messages'});
                models.User.hasMany(models.QuestionAnswer, {as: 'questionAnswers'});
            },
        }
    };

    return sequelize.define('user', fields, options);
}

