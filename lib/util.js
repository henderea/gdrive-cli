const { REV, timeout, mode, paths } = require('./util/core');
const { devLog, hookOutput } = require('./util/log');
const { sec } = require('./util/sec');

module.exports = {
    REV,
    timeout,
    mode,
    paths,
    devLog,
    hookOutput,
    sec
};