'use strict';

import config from './app';
import * as SequelizeStatic from 'sequelize';
import { Sequelize } from 'sequelize';

let sequelize: Sequelize = new SequelizeStatic(config.db.url, config.db.options);

export default sequelize;