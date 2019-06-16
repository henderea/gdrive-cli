//#region REV
const REV = 0;
//#endregion

//#region Imports
const fs = require('fs');
const path = require('path');
const util = require('util');
const _each = require('lodash/each');
//#endregion

//#region timeout
const timeout = util.promisify(setTimeout);
//#endregion

//#region mode
let mode = 'prod';

let dirname = eval('__dirname');

if(path.basename(dirname) == 'util') {
    mode = 'dev';
}
//#endregion

//#region paths
class Path extends String {
    constructor(...arguments_) {
        super(...arguments_);
    }

    at(...subPaths_) {
        return wrapPath(path.join(this.s, ...subPaths_));
    }

    createDir() {
        if(!fs.existsSync(this.s)) {
            fs.mkdirSync(this.s, { recursive: true });
        }
    }

    get s() {
        return this.toString();
    }
}

const wrapPath = (pth) => new Path(pth);

const rootPath = path.join(dirname, '../..');
const userPath = path.join(process.env.HOME, '.gdrive-cli');

const paths = {
    root: wrapPath(rootPath),
    user: wrapPath(userPath),
    base: wrapPath(mode == 'dev' ? rootPath : userPath),
    socket: '/tmp/gdrive-daemon.sock'
};
//#endregion

//#region module.exports
module.exports = {
    REV,
    timeout,
    mode,
    paths
};