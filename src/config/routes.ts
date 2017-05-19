'use strict';

import * as Router from 'koa-router';
import authenticate from '../api/middlewares/authenticate';
import {roles} from '../api/services/RoleService';

import omitFields from '../api/middlewares/omitFields';
import checkPermissions from '../api/middlewares/checkPermissions';
import checkEntity from "../api/middlewares/checkEntity";
import filterById from "../api/middlewares/filterById";

import GetList from "../api/actions/GetList";
import GetOne from "../api/actions/GetOne";
import Update from "../api/actions/Update";
import Create from "../api/actions/Create";
import BulkCreate from "../api/actions/BulkCreate";
import Remove from "../api/actions/Remove";
import BulkRemove from "../api/actions/BulkRemove";

import AccountController from '../api/controllers/v1/AccountController';
import ActionService from '../api/services/ActionService';
import AuthController from '../api/controllers/v1/AuthController';
import UserController from '../api/controllers/v1/UserController';
import MigrateController from '../api/controllers/v1/MigrateController';
import QuestionAnswer from '../api/controllers/v1/QuestionAnswerController';

let router = new Router({
    prefix: '/api'
});

router.use(authenticate);

router.get('/ping', (ctx) => ctx.body = 'pong');
// router.get('/migrate', checkPermissions(roles.USER),  MigrateController.run); // temporary

// Auth
router
    .post('/v1/signin', AuthController.signin)
    .post('/v1/signup', AuthController.signup)
    .post('/v1/refresh_token', AuthController.refreshToken);

// Account
router
  .get('/v1/account', checkPermissions(roles.USER), AccountController.getProfile)
  .put('/v1/account', checkPermissions(roles.USER), omitFields(['id', 'type']), AccountController.updateProfile)
  .post('/v1/account/set_password/:token', AuthController.setPassword);

// Skills
router
  .get('/v1/skill', checkPermissions(roles.USER), GetList('Skill'))
  .get('/v1/skill/:id', checkPermissions(roles.USER), GetOne('Skill'))
  .post('/v1/skill', checkPermissions(roles.USER), Create('Skill'))
  .post('/v1/skill/bulk/create', checkPermissions(roles.ADMIN), BulkCreate('Skill'))
  .put('/v1/skill/:id', checkPermissions(roles.ADMIN), omitFields(['id', 'email']), Update('Skill'))
  .delete('/v1/skill/:id', checkPermissions(roles.ADMIN), Remove('Skill'));

// Text records
router
  .get('/v1/text_record', checkPermissions(roles.USER), GetList('TextRecord'))
  .get('/v1/text_record/:id', checkPermissions(roles.USER), GetOne('TextRecord'))
  .post('/v1/text_record', checkPermissions(roles.USER), Create('TextRecord'))
  .put('/v1/text_record/:id', checkPermissions(roles.USER), omitFields(['id', 'userId']), Update('TextRecord'))
  .delete('/v1/text_record/:id', checkPermissions(roles.USER), Remove('TextRecord'));

// Messages
router
  .get('/v1/message', checkPermissions(roles.USER), GetList('Message'))
  .get('/v1/message/:id', checkPermissions(roles.USER), GetOne('Message'))
  .post('/v1/message', checkPermissions(roles.USER), Create('Message'))
  .put('/v1/message/:id', checkPermissions(roles.USER), omitFields(['id', 'userId']), Update('Message'))
  .delete('/v1/message/:id', checkPermissions(roles.USER), Remove('Message'));

// [ADMIN, USER] Manage users
router
    .get('/v1/user', checkPermissions(roles.USER), GetList('User'))
    .get('/v1/user/:id', checkPermissions(roles.USER), GetOne('User'))
    //.get('/v1/user/:id/beam/:filter', checkPermissions(roles.USER), BeamController.getUserBeams('params.id'))
    .post('/v1/user', checkPermissions(roles.USER), Create('User'))
    .post('/v1/user/bulk/create', checkPermissions(roles.ADMIN), BulkCreate('User'))
    .put('/v1/user/:id', checkPermissions(roles.ADMIN), omitFields(['id', 'email']), Update('User'))
    .delete('/v1/user/:id', checkPermissions(roles.ADMIN), Remove('User'))
    .post('/v1/user/bulk/remove', checkPermissions(roles.ADMIN), BulkRemove('User'))
    .put('/v1/user/bulk/status', checkPermissions(roles.ADMIN), UserController.setStatus);

// Manage posts
router
  .get('/v1/question_answer/', checkPermissions(roles.USER), QuestionAnswer.getList)
  .get('/v1/question_answer/:id', checkPermissions(roles.USER), GetOne('QuestionAnswer'))
  .post('/v1/question_answer', checkPermissions(roles.USER), Create('QuestionAnswer', [ActionService.setOwner()]))
  .post('/v1/question_answer/ask', checkPermissions(roles.USER), QuestionAnswer.processQuestion)
  .post('/v1/question_answer/:id/reply', checkPermissions(roles.USER), QuestionAnswer.processAnswer)
  .put('/v1/question_answer/:id', checkPermissions(roles.USER), Update('QuestionAnswer'))
  .put('/v1/question_answer/:id/reply/:answerId', checkPermissions(roles.USER), Update('QuestionAnswer'))
  .delete('/v1/question_answer/:id', checkPermissions(roles.USER), Remove('QuestionAnswer'))
  .post('/v1/question_answer/bulk/remove', checkPermissions(roles.USER), BulkRemove('QuestionAnswer'));

export default router;
