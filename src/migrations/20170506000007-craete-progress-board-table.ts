'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {

        return queryInterface.createTable('progress_board', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: 'user',
                    key: 'id'
                },
                onUpdate: 'cascade',
                onDelete: 'restrict'
            },
            status: {
                type: Sequelize.STRING
            },
            title: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.TEXT
            },
            linkUrl: {
                type: Sequelize.TEXT
            },
            skills: {
                type: Sequelize.ARRAY(Sequelize.INTEGER),
                defaultValue: []
            },
            createdAt: {
                type: Sequelize.DATE
            },
            updatedAt: {
                type: Sequelize.DATE
            }
        });

    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('progress_board');
    }
};