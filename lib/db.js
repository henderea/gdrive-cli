const Sequelize = require('sequelize');
const Umzug = require('umzug');
const _each = require('lodash/each');
const _set = require('lodash/set');
const { paths, devLog } = require('./util');

let dbLoc = paths.base.at('gdrive.db').s;
paths.base.createDir();

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbLoc,
    logging: function(query) {
        devLog.dim(query);
    }
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
        path: paths.root.at('migrations').s,
        pattern: /\.js$/
    },

    logging: (...arguments_) => {
        devLog.dim(...arguments_);
    }
});

const db = {};

const modelBuilders = {
    Config: require('../models/config'),
    Token: require('../models/token')
};

db.models = {};

db.initComplete = false;

db.init = async () => {
    if(!db.initComplete) {
        await umzug.up();
        _each(modelBuilders, (builder, name) => {
            db.models[name] = sequelize.import(name, builder);
        });
    }
    db.initComplete = true;
};

db.config = {};

db.config.getAllDbObjects = async () => {
    await db.init();
    return db.models.Config.findAll();
};

db.config.getAll = async () => {
    await db.init();
    let all = await db.config.getAllDbObjects();
    let obj = {};
    _each(all, cfg => {
        _set(obj, cfg.property, cfg.value);
    });
    return obj;
};

db.config.getDbObject = async (name, create = true) => {
    await db.init();
    let cfg;
    if(create) {
        let created;
        [cfg, created] = await db.models.Config.findOrCreate({
            where: {
                property: name
            },
            defaults: {
                value: null
            }
        });
        if(created) {
            devLog.dim(`Config property '${name}' was created.`);
        }
    } else {
        cfg = await db.models.Config.findOne({
            where: {
                property: name
            }
        });
    }
    return cfg;
};

db.config.get = async (name) => {
    await db.init();
    let cfg = await db.config.getDbObject(name);
    return cfg && cfg.value;
};

db.config.set = async (name, value) => {
    await db.init();
    const cfg = await db.config.getDbObject(name);
    cfg.value = value;
    return cfg.save();
};

db.config.unset = async (name) => {
    await db.init();
    const cfg = await db.config.getDbObject(name, false);
    if(cfg) {
        await cfg.destroy();
        return true;
    } else {
        return false;
    }
};

db.token = {};

db.token.getAllDbObjects = async () => {
    await db.init();
    return db.models.Token.findAll();
};

db.token.getAll = async () => {
    await db.init();
    let all = await db.token.getAllDbObjects();
    let obj = {};
    _each(all, tkn => {
        _set(obj, [tkn.account], tkn.token);
    });
    return obj;
};

db.token.getDbObject = async (account, create = true) => {
    await db.init();
    let tkn;
    if(create) {
        let created;
        [tkn, created] = await db.models.Token.findOrCreate({
            where: {
                account
            },
            defaults: {
                token: null
            }
        });
        if(created) {
            devLog.dim(`Token property '${account}' was created.`);
        }
    } else {
        tkn = await db.models.token.findOne({
            where: {
                account
            }
        });
    }
    return tkn;
};

db.token.get = async (account) => {
    await db.init();
    let tkn = await db.token.getDbObject(account);
    return tkn && tkn.token;
};

db.token.set = async (account, token) => {
    await db.init();
    const tkn = await db.token.getDbObject(account);
    tkn.token = token;
    return tkn.save();
};

db.token.unset = async (account) => {
    await db.init();
    const tkn = await db.token.getDbObject(account, false);
    if(tkn) {
        await tkn.destroy();
        return true;
    } else {
        return false;
    }
};

db.close = async () => sequelize.close();

module.exports = db;