module.exports.REV = 0;

const fs = require('fs');
const path = require('path');
const util = require('util');

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

const devLog = function() {
    if(mode == 'dev') {
        console.log.apply(null, arguments);
    }
};

module.exports.devLog = devLog;