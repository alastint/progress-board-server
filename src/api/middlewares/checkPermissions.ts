'use strict';

import RoleService from '../services/RoleService';
import AppError from '../services/AppError';

export default (allowedPermissions) => {
	return function(ctx, next) {
		if (RoleService.check(ctx.state.user, allowedPermissions)) {
			return next();
		} else {
			throw new AppError(403, 'You have not an access to perform this action!');
		}
	};
};
