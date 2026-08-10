'use strict';

/**
 * Add change_seq to PreloadRecord.
 *
 * change_seq = the Orthanc /changes "Last" sequence number at the moment the
 * preload finished. Later, when checking freshness, if the current /changes
 * Last has advanced by more than CHURN_INSTANCES (≈ the 4GB RAM cache size),
 * the warmed data has almost certainly been LRU-evicted by the flood — so the
 * "Cached" badge must honestly drop even though the DB record is <14 days old.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("PreloadRecord", "change_seq", {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("PreloadRecord", "change_seq");
  },
};
