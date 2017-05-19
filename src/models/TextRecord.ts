'use strict';

import logger from '../config/logger';
import config from '../config/app';
import * as uuid from 'uuid';
import * as _ from 'lodash';

export default function (sequelize, DataTypes) {

    const fields = {
        title: {type: DataTypes.STRING},
        description: {type: DataTypes.STRING},
        status: {type: DataTypes.STRING},
        type: {type: DataTypes.STRING},
        userId: {type: DataTypes.INTEGER}
    };

    const instanceMethods = {};

    const schema = {
        type: 'object',
        properties: {
            description: {type: 'string'},
            status: {type: 'string'},
            title: {type: 'string'},
            type: {type: 'string'},
            userId: {type: 'integer'}
        },
        additionalProperties: false,
        required: ['title']
    };

    /**
     * Relations for query filter service.
     * @type {{user: {model: string}}}
     */
    const relations = {
        questionAnswer: {model: 'QuestionAnswer'},
        user: {model: 'User'}
    };

    const options = {
        instanceMethods,
        timestamps: true,
        freezeTableName: true,
        classMethods: {
            associate(models) {
                // relation to User
                models.TextRecord.belongsTo(models.User, {as: 'user', foreignKey: 'userId'});
                models.User.hasMany(models.Skill, {as: 'skills'});

                // relation to QuestionAnswer
                //models.TextRecord.belongsTo(models.QuestionAnswer, {as: 'question'});
                //models.TextRecord.belongsTo(models.QuestionAnswer, {as: 'answer', foreignKey: "answerId"});

                //models.QuestionAnswer.hasMany(models.TextRecord, {as: 'question', foreignKey: "id"});
                //models.QuestionAnswer.hasMany(models.TextRecord, {as: 'answers', foreignKey: "answerId"});
            },
            schema,
            createOrIncrement: function (textRecords) {
                let replacements:any = {};

                _.each(textRecords, textRecord => replacements[textRecord] = textRecord);

                // Sequenize still doesn`t support UPSERT operation for Postgres
                // so, use raw query for that.
                return sequelize.query(`INSERT INTO ${this.tableName} ("id", "value", "createdAt", "updatedAt") 
                    VALUES ${_.map(textRecords, t => {
                        return `(DEFAULT, :${t}, NOW(), NOW())`
                    })} 
                    ON CONFLICT (value) DO 
                    UPDATE SET counter = text_record.counter + 1`, {
                    replacements,
                    type: sequelize.QueryTypes.BULKUPDATE
                });

            }
        }
    };

    return sequelize.define('text_record', fields, options)
}