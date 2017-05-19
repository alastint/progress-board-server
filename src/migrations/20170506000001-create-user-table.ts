'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('user', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            firstName: {
                type: Sequelize.STRING
            },
            lastName: {
                type: Sequelize.STRING
            },
            nickName: {
                type: Sequelize.STRING
            },
            password: {
                type: Sequelize.STRING
            },
            email: {
                type: Sequelize.STRING
            },
            role: {
                type: Sequelize.STRING
            },
            gender: {
                type: Sequelize.STRING
            },
            status: {
                type: Sequelize.STRING
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            picture: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.TEXT
            },
            dob: {
                type: Sequelize.DATE
            },
            lastQuestionAnswerId: {
                type: Sequelize.INTEGER
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });


    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('user');
    }
};