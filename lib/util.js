module.exports.REV = 0;

const fs = require('fs');
const path = require('path');
const util = require('util');
const chalk = require('chalk');
const _ = require('lodash');
const crypto = require('crypto');

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

const sec = {};

sec.md5 = (text) => crypto.createHash('md5').update(text).digest('hex')

sec.encrypt = (text, password) => {
    let key = sec.md5(password);
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

sec.decrypt = (text, password) => {
    let key = sec.md5(password);
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}

module.exports.sec = sec;