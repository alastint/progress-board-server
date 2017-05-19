'use strict';

import models from '../../models';
import config from '../../config/app';
import logger from '../../config/logger';
import AppError from './AppError';
import Utils from './Utils';
import * as _ from 'lodash';

/**
 * Get list of aliases related models
 * @param ctx
 * @param model
 * @returns {Array}
 */
const parseInclude = function (ctx, model) {

    const query = ctx.query;

    if (!query.include) { return []}

    const relations = _.get(model, 'relations');

    if (!relations) {
        logger.warn(`Model ${model.name} hasn't describe any relations. Field relations = ${relations}`);
        return [];
    }

    let parsedInclude = [];
    try {
        parsedInclude = JSON.parse(query.include)
    } catch (e) {
        throw new AppError(500, 'Parameter `include` is not valid json.', e.Message)
    }

    return _.chain(parsedInclude)
        .map(function (name) {
            const relation:any = _.get(relations, name);

            if (!relation) { return logger.warn(`Relation ${name} doesn't exist for model ${model.name}`) }
            if (!_.has(models, relation.model)) { return logger.warn(`Model ${relation.model} doesn't exist`) }

            const relatedModel = models[relation.model];

            // ignore hidden fields
            let attributes = _.chain(relatedModel.attributes)
                .filter(function (attribute) {
                    return !attribute.private;
                })
                .map('field')
                .value();

            if (relation.attributes && _.size(relation.attributes) > 0) {
                attributes = _.intersection(attributes, relation.attributes);
            }

            // if (relation.extra && _.size(relation.extra) > 0) {
            if (_.isFunction(relatedModel.extraFields)) {
                const extraFields = relatedModel.extraFields(name);

                if (!_.isEmpty(extraFields) && _.isObject(extraFields)) {
                    attributes = _.concat(attributes, _.values(Utils.mapAnyRows(extraFields, ctx)))
                }
            }
            // }

            const result:any = {model: relatedModel, as: name, attributes};

            if (relation.on) {result.on = relation.on}

            return result

        }).compact().value();
};

/**
 * Parse list of requested specific model fields
 * @param ctx
 * @param model
 * @returns {Array}
 */
const parseFields = function (ctx, model) {

    const query = ctx.query;

    let result = [];

    if (query.fields) {
        try {
            result = JSON.parse(query.fields)
        } catch (e) {
            throw new AppError(500, 'Parameter `attributes` is not valid json.', e.Message)
        }
    }

    return result;
};

/**
 * Parse order by fields
 * @param ctx
 * @param model
 * @returns {Array}
 */
const parseOrderBy = function (ctx, model) {

    const query = ctx.query;

    if (!query.order) { return '' }

    let parsedOrder = {};
    try {
        parsedOrder = JSON.parse(query.order)
    } catch (e) {
        throw new AppError(500, 'Parameter `order` is not valid json.', e.Message)
    }

    return _.chain(parsedOrder)
        .each(function (value, key) {
            parsedOrder[key] = `"${key}" ${ value > 0 ? 'ASC' : 'DESC' }`
        })
        .pick(_.keys(model.attributes))
        .values()
        .join(', ')
        .value();
};

/**
 * Parse filter by fields
 * @param ctx
 * @returns {Array}
 */
const parsePagination = function (ctx) {

    const query = ctx.query;

    const page = _.parseInt(query.page) || 1;
    const limit = _.parseInt(query.limit) || config.pageLimit;

    return {
        offset: (page - 1) * limit,
        limit
    }
};


/**
 * Parse page number and limit
 * @param ctx
 * @param model
 * @returns {Array}
 */
const parseWhere = function (ctx, model) {

    const query = ctx.query;

    if (!query.where) { return {} }

    let parsedWhere = {};
    try {
        parsedWhere = JSON.parse(query.where)
    } catch (e) {
        throw new AppError(500, 'Parameter `where` is not valid json.', e.Message)
    }

    return _.chain(parsedWhere)
        .each(function (value, key) {
            if (!_.hasIn(model.attributes, key)) {
                throw new AppError(400, `Parameter ${key} in "where" is not valid.`);
            }

            switch (true) {
                case _.isNumber(value):
                    parsedWhere[key] = value;
                    break;
                case _.isString(value):
                    parsedWhere[key] = {$ilike: `%${value}%`};
                    break; // ILIKE '%hat%'
                case _.isArray(value):
                    parsedWhere[key] = {$overlap: value};
                    break; // && [1, 2] (PG array overlap operator)
            }
        })
        .value();
};

/**
 * Parse page number and limit
 * @param ctx
 * @param model
 * @returns {Array}
 */
const parseSearch = function (ctx, model) {

    const query = ctx.query;

    if (!query.search) { return {} }

    let parsedSearch:any = {};
    let searchParams:any = {$or: []};
    try {
        parsedSearch = JSON.parse(query.search)
    } catch (e) {
        throw new AppError(500, 'Parameter `search` is not valid json.', e.Message)
    }
    _.chain(parsedSearch)
        .each((value, key) => {
            if (!_.hasIn(model.attributes, key)) {
                throw new AppError(400, `Parameter ${key} in "search" is not valid.`);
            }

            let searchFor:any = {};
            switch (true) {
                case _.isNumber(value):
                    searchFor[key] = value;
                    break;
                case _.isString(value):
                    searchFor[key] = {$ilike: `%${value}%`};
                    break;
            }
            return searchParams.$or.push(searchFor);
        })
        .value();

    return searchParams;
};

/**
 * Parse all fields.
 * @param ctx
 * @param model
 * @returns {any}
 */
const parseAll = function (ctx, model) {

    const params:any = _.merge(parsePagination(ctx), {
        where: ctx.query.where ? parseWhere(ctx, model) : parseSearch(ctx, model),
        include: parseInclude(ctx, model),
        order: parseOrderBy(ctx, model),
        attributes: parseFields(ctx, model)
    });

    if (_.size(params.attributes) == 0) { delete params.attributes }

    return params;
};

export default {
    parseAll,
    parseInclude,
    parseFields,
    parsePagination,
    parseSearch,
    parseWhere,
    parseOrderBy,
};