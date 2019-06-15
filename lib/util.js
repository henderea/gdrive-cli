module.exports.REV = 0;

const fs = require('fs');
const path = require('path');
const util = require('util');
const chalk = require('chalk');
const _ = require('lodash');

const timeout = util.promisify(setTimeout);

module.exports.timeout = timeout;

let mode = 'prod';

let dirname = eval('__dirname');

if(path.basename(dirname) == 'lib') {
    mode = 'dev';
}

module.exports.mode = mode;

let rootPath = path.join(dirname, mode == 'dev' ? '..' : '../..');

module.exports.rootPath = rootPath;

const devLog = (...arguments_) => {
    if(mode == 'dev') {
        console.log.apply(null, arguments_);
    }
};

const mods = {
    dim(arg) { return chalk.dim(arg); },
    green(arg) { return chalk.green(arg); },
    yellow(arg) { return chalk.yellow(arg); },
    red(arg) { return chalk.red(arg); },
    eCen(arg) { return _.pad(` ${arg} `, (this._centerSize || 40) + 1, '=').slice(0, -1); }
}

const modProps = {};

for(const [modName, mod] of Object.entries(mods)) {
    modProps[modName] = {
        get() {
            return createBuilder(this, [...(this._mods || []), mod], this._centerSize);
        }
    };
}

modProps.centerSize = {
    get() {
        return function(centerSize) {
            return createBuilder(this, this._mods, centerSize);
        }.bind(this);
    }
};

const proto = Object.defineProperties(() => { }, modProps)

devLog.__proto__ = proto;

const createBuilder = (self, _mods, _centerSize) => {
    const builder = (...arguments_) => devLog(_.flow(builder._mods).apply(self, [_.join(arguments_, ' ')]));
    builder._mods = _mods;
    builder._centerSize = _centerSize;
    builder.__proto__ = proto;
    return builder;
}

module.exports.devLog = devLog;