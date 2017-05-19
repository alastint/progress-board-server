'use strict';

import logger from '../config/logger';
import models from './index';
import * as _ from 'lodash';
import * as Bluebird from "bluebird";

export default function (sequelize, DataTypes) {

    /**
     * List of available beam statuses
     * @type {{ENABLED: string; DISABLED: string}}
     */
    const statuses = {
        ENABLED: 'enabled',
        DISABLED: 'disabled',
        BANNED: 'banned'
    };

    const fields = {
        title: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: statuses.ENABLED
        },
        rating: {
            type: DataTypes.INTEGER
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        questionId: {
            type: DataTypes.INTEGER,
            defaultValue: [],
            allowNull: false,
        },
        answersId: {
            type: DataTypes.ARRAY(DataTypes.INTEGER)
        }
    };

    const instanceMethods = {};

    const relations = {
        question: {model: 'TextRecord'},
        answers: {model: 'TextRecord', on: sequelize.literal('"answers"."id" = ANY("question_answer"."answersId")')},
        user: {model: 'User'},
    };

    const schema = {
        type: 'object',
        properties: {
            questionId: {type: 'integer'},
            answersId: {
                type: 'array',
                items: {type: "integer"}
            },
            userId: {type: 'integer'},
            rating: {type: 'integer'},
            status: {type: 'string'},
            title: {type: 'string'},
            type: {type: 'string'}
        },
        additionalProperties: false,
        required: ['questionId']
    };

    const hooks = {
        afterCreate: async function (instance, options) {
            logger.info('afterCreate');

            await models.User.update({lastQuestionAnswerId:instance.id},{where:{id:instance.userId}});

            return new Bluebird((resolve, reject) => {
                resolve(instance)
            });
        },
    };

    const options = {
        hooks,
        instanceMethods,
        timestamps: true,
        freezeTableName: true,
        paranoid: true,
        classMethods: {
            statuses,
            relations,
            schema,
            associate(models) {

                // relation to User
                models.QuestionAnswer.belongsTo(models.User, {as: 'user'});
                models.User.hasMany(models.QuestionAnswer, {as: 'questionAnswers'});

                // relation to TextRecord
                models.QuestionAnswer.belongsTo(models.TextRecord, {as: 'question'});
                models.QuestionAnswer.belongsTo(models.TextRecord, {as: 'answers'});

                models.QuestionAnswer.hasMany(models.TextRecord, {as: 'answers', foreignKey: 'id'});
            },
        }
    };

    return sequelize.define('question_answer', fields, options)
}

