'use strict';

import * as AWS from 'aws-sdk';
import config from '../../config/app';

AWS.config.update(config.aws);

export default AWS;