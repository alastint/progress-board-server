'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {

        return queryInterface.createTable('question_answer', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            questionId: {
                type: Sequelize.INTEGER
            },
            answersId: {
                type: Sequelize.ARRAY(Sequelize.INTEGER),
                defaultValue: []
            },
            rating: {
                type: Sequelize.INTEGER
            },
            status: {
                type: Sequelize.STRING
            },
            title: {
                type: Sequelize.STRING
            },
            type: {
                type: Sequelize.STRING,
                allowNull: true
            },
            deletedAt: {
                type: Sequelize.DATE
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
        return queryInterface.dropTable('question_answer');
    }
};