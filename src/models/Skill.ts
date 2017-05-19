'use strict';

import logger from '../config/logger';
import config from '../config/app';
import * as uuid from 'uuid';
import * as _ from 'lodash';

export default function (sequelize, DataTypes) {

    const fields = {
        title: {type: DataTypes.STRING},
        description: {type: DataTypes.STRING},
        status: {type: DataTypes.STRING}
    };

    const indexes = [
        {unique: true, fields: ['title']}
    ];

    const instanceMethods = {};

    const schema = {
        type: 'object',
        properties: {
            description: {type: 'string'},
            status: {type: 'string'},
            title: {type: 'string'}
        },
        additionalProperties: false,
        required: ['title']
    };

    const options = {
        indexes,
        instanceMethods,
        timestamps: true,
        freezeTableName: true,
        classMethods: {
            //associate(models) {},
            schema,
            createOrIncrement: function (skills) {
                let replacements:any = {};

                _.each(skills, skill => replacements[skill] = skill);

                // Sequenize still doesn`t support UPSERT operation for Postgres
                // so, use raw query for that.
                return sequelize.query(`INSERT INTO ${this.tableName} ("id", "value", "createdAt", "updatedAt") 
                    VALUES ${_.map(skills, t => {
                        return `(DEFAULT, :${t}, NOW(), NOW())`
                    })} 
                    ON CONFLICT (value) DO 
                    UPDATE SET counter = skill.counter + 1`, {
                    replacements,
                    type: sequelize.QueryTypes.BULKUPDATE
                });

            }
        }
    };

    return sequelize.define('skill', fields, options)
}