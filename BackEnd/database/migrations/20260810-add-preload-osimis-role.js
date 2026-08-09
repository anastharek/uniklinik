'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "Roles", // table name
      "preload_osimis", // new field name
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Roles", "preload_osimis");
  }
};
