const path = require('path');
const Sequelize = require('sequelize');
const Umzug = require('umzug');
const chalk = require('chalk');
const { env } = require('./util');

let dbLoc = path.join(process.env.HOME, '.gdrive-cli/gdrive.db');
if(env.mode == 'dev') {
    dbLoc = path.join(__dirname, 'dev.db');
}

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbLoc
});

const umzug = new Umzug({
    storage: 'sequelize',
    storageOptions: {
        sequelize: sequelize
    },

    migrations: {
        params: [
            sequelize.getQueryInterface(),
            sequelize.constructor,
            function() {
                throw new Error('Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.');
            }
        ],
        path: '../migrations',
        pattern: /\.js$/
    }
});

const db = {};

db.init = async () => umzug.up();

db.close = async () => sequelize.close();

module.exports = db;