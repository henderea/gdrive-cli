const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const { google } = require('googleapis');

const { sec, paths, devLog } = require('./util');

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const TOKEN_PATH = paths.user.at('token.json').s;

const drive = {};

drive._ = {};

drive._.config = null;

drive.init = (pw) => {
    if(_.isNil(pw)) { return false; }
    try {
        const eData = fs.readFileSync(paths.root.at('api-auth.json.enc').s, 'utf8');
        const data = sec.decrypt(eData, pw);
        let c = JSON.parse(data);
        drive._.config = c;
        return true;
    } catch {
        return false;
    }
}

module.exports = drive;