'use strict';

import config from '../../config/app';
import logger from '../../config/logger';
import * as request from 'request';
import * as _ from 'lodash';
import * as Bluebird from "bluebird";
import AppError from "./AppError";

const send = function(url, method = 'GET', header = {}, body = {}) {
    return new Bluebird(function (resolve, reject) {
        delete  header["content-length"];

        const bodyJSON = _.isString(body) ? body : JSON.stringify(body);

        const options = {method, url, body: bodyJSON, header};

        logger.verbose(`Sending request with options : \n ${JSON.stringify(options)}`);

        request(options, function(error, httpResponse, response) {
            if (error) {
                reject(url + " : " + error);
                // throw new AppError(500, url + " : " + error);
            } else {
                resolve(body);
            }
        });
    });
};

export default {send}