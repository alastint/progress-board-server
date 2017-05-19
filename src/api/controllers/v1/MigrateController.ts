'use strict';

/**
 *
 *  FOR ONE TIME MIGRATION DATA FROM EXISTS BACKEND
 *
 */


const pg = require('pg');
const _ = require('lodash');
const async = require('async');
const PgPromise = require('pgpromise');
import models from '../../../models';

const connect = async function () {
    return (new PgPromise(pg, "postgres://postgres:postgres@localhost/beam_prod")).connect();
};

const user = async function (connect) {
    // make promised queries.
    const account = await connect.client.queryP('SELECT * from account GROUP BY id, email ORDER BY id DESC');

    const users = _.map(account.rows, function (row) {

        return {
            id: _.toInteger(row.id),
            email: row.email || `${Date.now()}-${Math.round(Math.random() * 10000)}@dummy.com`,
            password: 'password',
            pictureName: row.picture,
            gender: row.gender.toLocaleLowerCase(),
            dob: row.dob,
            description: row.description,
            type: row.type == 1 ? models.User.types.TRUSTED : models.User.types.NORMAL,
        };
    });

    const result = [];
    for (let i in users) {
        try {
            const r = await models.User.create(users[i]);
            result.push(r);
        } catch (e) { console.error(e) }
    }

    console.log(account.rows);

    return result;
};

const tag = async function (connect) {
    // make promised queries.
    const record = await connect.client.queryP('SELECT * from hashtag  GROUP BY id');

    const data = _.map(record.rows, function (row) {

        return {
            id: _.toInteger(row.id),
            value: row.tag,
        };
    });

    const result = await models.Tag.bulkCreate(data, {individualHooks: true});

    console.log(record.rows);

    return result;
};

const interest = async function (connect) {
    // make promised queries.
    const record = await connect.client.queryP('SELECT * from interests  GROUP BY id');

    const data = _.map(record.rows, function (row) {

        return {
            id: _.toInteger(row.id),
            name: row.name,
            description: '',
            imageURL: row.image,
            rectangleImageURL: row.image,
        };
    });

    const result = await models.Interest.bulkCreate(data, {individualHooks: true});

    console.log(record.rows);

    return result;
};

const library = async function (connect) {
    // make promised queries.
    const record = await connect.client.queryP('SELECT * from library  GROUP BY id');

    const data = _.map(record.rows, function (row) {

        return {
            id: _.toInteger(row.id),
            categoryId: row.category_id,
            title: row.name,
            description: row.description,
            type: row.type == 1 ? models.Library.types.POPULAR : models.Library.types.GALLERY,
            bigPictureUrl: row.big_picture,
            smallPictureUrl: row.small_picture,
        };
    });

    const result = await models.Library.bulkCreate(data, {individualHooks: true});

    console.log(record.rows);

    return result;
};

const beam = async function (connect) {
    // make promised queries.
    // const record = await connect.client.queryP('SELECT * FROM beams b JOIN account a ON (a.id = b.owner) GROUP BY b.id');
    const record = await connect.client.queryP('SELECT * FROM beams b  GROUP BY b.id');

    const data = _.map(record.rows, function (row) {

        const types = _.values(models.Beam.types);

        return {
            id: _.toInteger(row.id),
            userId: row.owner || 0,
            type: types[row.type],
            title: row.title,
            description: row.description,
            linkUrl: '',
            properties: row.properties,
            imageName: 'foreground',
        };
    });

    const result = [];
    for (let i in data) {
        try {
            const r = await models.Beam.create(data[i]);
            result.push(r);
        } catch (e) {
            console.error(e);
        }
    }

    console.log(record.rows);

    return result;
};    // make promised queries.

const post = async function (connect) {

    let users = await models.User.findAll({
        include: {
            model: models.Stream, as: 'streams'
        }
    });

    users = _.chain(users).map(function (user) {
        return {
            id: user.id,
            streamId: _.get(user, 'streams[0].id', 0)
        }
    }).keyBy('id').value();

    let beams = await models.Beam.findAll();

    const data = _.map(beams, function (beam) {

        const user = _.get(users, beam.userId.toString(), {});

        return {
            title: beam.title,
            linkUrl: beam.linkUrl,
            streamId: user.streamId || 0,
            userId: beam.userId,
            beamId: [beam.id]
        };
    });

    const result = await models.Post.bulkCreate(data, {individualHooks: true});

    return result;
};

const follow = async function (connect) {
    // make promised queries.
    const record = await connect.client.queryP('SELECT * FROM follows');

    const data = _.map(record.rows, function (row) {

        return {
            id: _.toInteger(row.id),
            followerId: row.followers,
            followingId: row.following,
            status: 'accepted',
        };
    });

    const result = await models.Follow.bulkCreate(data, {individualHooks: true});

    console.log(record.rows);

    return result;
};    // make promised queries.

const like = async function (connect) {

    // make promised queries.
    const record = await connect.client.queryP('SELECT * FROM beam_likes');

    const data = _.map(record.rows, function (row) {

        return {
            id: _.toInteger(row.id),
            userId: row.account,
            beamId: row.beam,
            isLike: row.is_like,
        };
    });

    const result = await models.BeamLike.bulkCreate(data, {individualHooks: true});

    console.log(record.rows);

    return result;
};    // make promised queries.

const event = async function (connect) {

    // make promised queries.
    const record = await connect.client.queryP('SELECT * FROM audit');

    const data = _.compact(_.map(record.rows, function (row) {

        const types = models.Event.types;
        let type = '';
        switch (row.event_type) {
            case 'FOLLOW_USER':
                type = types.USER_FOLLOW;
                break;
            case 'LIKE':
                type = types.BEAM_LIKE;
                break;
            default:
                return null;
        }

        return {
            id: _.toInteger(row.id),
            userId: _.toInteger(row.account),
            targetId: _.toInteger(row.target_object),
            title: row.description,
            type: type,
        };
    }));

    const result = await models.Event.bulkCreate(data, {individualHooks: true});

    return data;
};    // make promised queries.

const user_update = async function (connect) {

    // make promised queries.
    const accounts_interests = await connect.client.queryP('SELECT * FROM accounts_interests');

    const groups = _.groupBy(accounts_interests.rows, 'account_id');

    for (var id in groups) {
        const interestId = _.map(groups[id], 'interest_id');
        await models.User.update({interestId, categoryId: []}, {where: {id: _.toInteger(id)}});
    }

    return groups;
};    // make promised queries.


const run = async function (ctx) {
    const connection = await connect();

    try {
        ctx.body = {
            // users: await user(connection),
            // categories: await category(connection),
            // tags: await tag(connection),
            // interest: await interest(connection),
            // library: await library(connection),
            // beam: await beam(connection),
            // post: await post(connection),
            // follow: await follow(connection),
            // like: await like(connection),
            // event: await event(connection),
            // beam_tag: await beam_tag(connection),
            // user_update: await user_update(connection),
        }
    } catch (e) {
        console.error(e);
        ctx.body = e;
    }
};

export default {
    run
};
