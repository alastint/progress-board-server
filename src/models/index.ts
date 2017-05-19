'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import config from '../config/app';
import * as SequelizeStatic from 'sequelize';
import {Sequelize} from 'sequelize';

const sequelize:Sequelize = new SequelizeStatic(config.db.url, config.db.options);
const basename = path.basename(module.filename);
const models:any = {};

fs.readdirSync(__dirname)
    .filter(function (file) {
        //return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
        return (file.indexOf('.') !== 0) && (file !== basename);
    })
    .forEach(function (file) {
        let model:any = sequelize.import(path.join(__dirname, file));

        // "model_name" => "ModelName"
        const modelName = _.upperFirst(_.camelCase(model.name));

        models[modelName] = model;
    });

Object.keys(models).forEach(function (modelName) {
    if (typeof models[modelName].associate === "function") {
        models[modelName].associate(models);
    }
});

models.sequelize = sequelize;
models.Sequelize = SequelizeStatic;

export default models;