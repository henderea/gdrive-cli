//#region Imports
const { mode, paths } = require('./core');
const chalk = require('chalk');
const fs = require('fs');
const stripAnsi = require('strip-ansi');
const _pad = require('lodash/pad');
const _flow = require('lodash/flow');
const _join = require('lodash/join');
//#endregion

//#region devLog
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
    eCen(arg) { return _pad(` ${arg} `, (this._centerSize || 40) + 1, '=').slice(0, -1); }
};

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
    const builder = (...arguments_) => devLog(_flow(builder._mods).apply(self, [_join(arguments_, ' ')]));
    builder._mods = _mods;
    builder._centerSize = _centerSize;
    builder.__proto__ = proto;
    return builder;
};
//#endregion

//#region hookOutput
const hookOutputStream = (stream, path) => {
    if(stream.hooked) { return false; }
    stream.hooked = true;
    const write = stream.write;
    stream.write = function(string, encoding, fd) {
        write.apply(stream, arguments);
        fs.appendFileSync(path, stripAnsi(string));
    }
    return () => {
        stream.write = write;
    };
}

const hookOutput = (logFileName) => {
    const logs = paths.base.at('logs');
    logs.createDir();
    const stdOutName = logs.at(`${logFileName}.stdout`).s;
    const stdErrName = logs.at(`${logFileName}.stderr`).s;
    const revertStdout = hookOutputStream(process.stdout, stdOutName);
    const revertStderr = hookOutputStream(process.stderr, stdErrName);
    return {
        revertStdout,
        revertStderr
    };
}
//#endregion

module.exports = {
    devLog,
    hookOutput
};