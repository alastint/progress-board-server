'use strict';

import logger from '../config/logger';
import config from '../config/app';
import * as uuid from 'uuid';
import * as _ from 'lodash';

export default function (sequelize, DataTypes) {

    const fields = {
        text: {type: DataTypes.STRING},
        status: {type: DataTypes.STRING},
        userId: {type: DataTypes.INTEGER}
    };

    const instanceMethods = {};

    const schema = {
        type: 'object',
        properties: {
            text: {type: 'string'},
            status: {type: 'string'},
            userId: {type: 'integer'}
        },
        additionalProperties: false,
        required: ['text','userId']
    };

    /**
     * Relations for query filter service.
     * @type {{user: {model: string}}}
     */
    const relations = {
        user: {model: 'User'}
    };

    const options = {
        instanceMethods,
        timestamps: true,
        freezeTableName: true,
        classMethods: {
            associate(models) {
                // relation to User
                models.Message.belongsTo(models.User, {as: 'user', foreignKey: 'userId'});
                models.User.hasMany(models.Message, {as: 'messages', foreignKey: 'userId'});
            },
            schema,
            createOrIncrement: function (messages) {
                let replacements:any = {};

                _.each(messages, message => replacements[message] = message);

                // Sequenize still doesn`t support UPSERT operation for Postgres
                // so, use raw query for that.
                return sequelize.query(`INSERT INTO ${this.tableName} ("id", "value", "createdAt", "updatedAt") 
                    VALUES ${_.map(messages, t => {
                        return `(DEFAULT, :${t}, NOW(), NOW())`
                    })} 
                    ON CONFLICT (value) DO 
                    UPDATE SET counter = message.counter + 1`, {
                    replacements,
                    type: sequelize.QueryTypes.BULKUPDATE
                });

            }
        }
    };

    return sequelize.define('message', fields, options)
}