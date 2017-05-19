'use strict';

import logger from '../../config/logger';
import * as _ from 'lodash';

export const permissions: any = {
	PERSONNEL: 1,   // can manage personnel - currently only admin can do this
	TICKETS: 2,     // can manage tickets
	CARTS: 4,       // can manage carts
	ALERTS: 8,      // can manage alerts
	ISSUES: 16,     // can manage issues
	RACES: 32,      // can manage races
	USERS: 64,
	RESERVED2: 128,
	RESERVED3: 256
};

/**
 * Set user's permissions
 * usage: set(user, [permissions.TICKETS, permissions.PERSONNEL])
 * @param user
 * @param newPermissions
 */
const set = function (user, newPermissions = []) {
	let oldPermissions = user.permissions;
	user = newPermissions.reduce((userPermissions, nextPermission) => userPermissions |= nextPermission, 0);
	logger.info(`[PERMISSIONS] set ${oldPermissions} -> ${user.permissions}`);
	return user;
};

const check = function (user, reqPermissions) {
	// tslint:disable-next-line:triple-equals
	logger.info(`[PERMISSIONS] check, user:${user.permissions}, required:${reqPermissions}, is allowed: ${(user.permissions & reqPermissions) == reqPermissions}`);
	// tslint:disable-next-line:triple-equals
	return (user.permissions & reqPermissions) == reqPermissions;
};

/**
 * Check if passed permissions is possible
 * @param permissionsToValidate - number
 */
const validate = function (permissionsToValidate) {
	/* invalid permissions format */
	// if (!_.isNumber(permissionsToValidate) || permissionsToValidate < 0) return false;
	/* allow nothing */
	if (permissionsToValidate === 0) return true;
	/* do not allow PERSONNEL permission - it's only for admin! */
	// tslint:disable-next-line:triple-equals
	if ((permissionsToValidate & permissions.PERSONNEL) == permissions.PERSONNEL) return false;

	return true;
};
export default {
	set,
	check,
	validate
};