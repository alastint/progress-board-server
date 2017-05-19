'use strict';

import models from '../models';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return models.User.bulkCreate([{
            id: 1,
            first_name: "Admin",
            last_name: "pb",
            role: "super",
            email: "adminpb@dummy.com",
            dob: "1990-10-10 11:11:39",
            gender: "male",
            password: "adminpb123",
            description: "Here is my description..."
        }, {
            id: 2,
            first_name: "User",
            last_name: "Test",
            role: "user",
            email: "user.test@dummy.com",
            dob: "1992-06-10 11:11:39",
            gender: "male",
            password: "user123",
            description: "Test User description."
        }], {individualHooks : true})
    },
    down: function(queryInterface, Sequelize) {}
};