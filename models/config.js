'use strict';
module.exports = (sequelize, DataTypes) => {
  const Config = sequelize.define('Config', {
    property: DataTypes.STRING,
    value: DataTypes.STRING
  }, {});
  Config.associate = function(models) {
    // associations can be defined here
  };
  return Config;
};