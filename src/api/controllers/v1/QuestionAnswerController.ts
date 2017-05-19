'use strict';

import config from '../../../config/app';
import logger from '../../../config/logger';
import models from '../../../models';
import AppError from '../../services/AppError';
import S3Service from '../../services/S3Service';
import QueryFilterService from '../../services/QueryFilterService';
import EmailService from '../../services/EmailService';
import EventService from '../../services/EventService';
import ActionService from '../../services/ActionService';
import Create from '../../actions/Create';
import Update from '../../actions/Update';
import * as _ from 'lodash';
import * as slug from 'slug';
import * as Ajv from 'ajv';
import GetList from '../../actions/GetList';

const ajv = Ajv({allErrors: true});

/**
 * get /beam
 */
const getList = async function (ctx) {

    const action = ctx.state.user.isAdmin()
        ? GetList('QuestionAnswer')
        : GetList('QuestionAnswer');

    return action(ctx);
};

/**
 * get /account/question_answer/:filter
 * get /user/:id/question_answer/:filter
 * @param key
 */
const getByFilter = function (key = 'state.user.id') {
    return async function (ctx) {

        if (!_.get(ctx, key)) {throw new AppError(400, 'User ID should not be empty.')}

        let scopes:any = [];

        if(!ctx.state.user.isAdmin()){
            scopes.push('publicOnly');
        }

        const filter = _.isEmpty(ctx.params.filter) ? 'created' : ctx.params.filter;

        switch (filter) {
            case 'created':
                scopes.push({method: 'created', key});
                break;
            default:
                throw new AppError(500, 'Invalid filter name');
        }

        const handler = GetList('QuestionAnswer', scopes);

        await handler(ctx);
    }
};

/**
 * post /question_answer/ask
 * @param ctx
 */
const processQuestion = async function (ctx) {
    let data:any = ctx.request.body;

    data.userId = ctx.state.user.id;

    const schema = models.TextRecord.schema;

    const valid = ajv.validate(schema, data);
    if (!valid) {throw new AppError(400, ajv.errorsText(), ajv.errors.toString())}

    const entity = await models.TextRecord.create(data);

    logger.verbose(`Created new text record. ID: ${entity.id}`);

    const questionAnswer = await models.QuestionAnswer.create({
        title: entity.title,
        questionId: entity.id,
        userId: data.userId
    });

    ctx.status = 201;
    ctx.body = {data: questionAnswer};

    ctx.state.textRecord = entity;

    logger.verbose(`Created new question (QuestionAnswer ID: ${questionAnswer.id}) with question (TextRecord ID: ${entity.id})`);
};

/**
 * post /question_answer/:id/reply
 * @param ctx
 */
const processAnswer = async function (ctx) {
    let data:any = ctx.request.body;

    data.userId = ctx.state.user.id;

    const schema = models.TextRecord.schema;

    const valid = ajv.validate(schema, data);
    if (!valid) {throw new AppError(400, ajv.errorsText(), ajv.errors.toString())}

    const entity = await models.TextRecord.create(data);

    logger.verbose(`Created new text record. ID: ${entity.id}`);

    const questionAnswer = await models.QuestionAnswer.findOne({
        where: {id: ctx.params.id}
    });

    questionAnswer.answersId.push(entity.id);

    const resp = await models.QuestionAnswer.update(
      { answersId: questionAnswer.answersId },
      { where: { id: questionAnswer.id } }
    );

    ctx.status = 201;
    ctx.body = {data: questionAnswer};

    ctx.state.textRecord = entity;

    logger.verbose(`Replyed on question (QuestionAnswer ID: ${questionAnswer.id}) with answer (TextRecord ID: ${entity.id})`);
};

export default {
    processQuestion,
    processAnswer,
    getByFilter,
    getList
};