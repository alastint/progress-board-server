'use strict';

import * as _ from 'lodash';

export const roles:any = {
    SUPER_ADMIN: 'super',
    ADMIN: 'admin',
    MENTOR: 'mentor',
    PUBLISHER: 'publisher',
    PUBLISHER_PENDING: 'publisher_pending',
    USER: 'user'
};

const check = function (user = {}, reqPermission) {

    const permissions = {};

    permissions[roles.USER] = 1;
    permissions[roles.PUBLISHER_PENDING] = 2;
    permissions[roles.PUBLISHER] = 3;
    permissions[roles.MENTOR] = 3;
    permissions[roles.ADMIN] = 4;
    permissions[roles.SUPER_ADMIN] = 5;

    let role = _.get(user, "role");
    return _.get(permissions, role, 0) >= permissions[reqPermission];
};

const roleIsAdmin = role => {
    return _.includes([roles.SUPER_ADMIN, roles.ADMIN], role)
};


export default {
    check,
    roleIsAdmin
};