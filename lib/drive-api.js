const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const db = require('./db');

const { google } = require('googleapis');

const { sec, paths, devLog } = require('./util');

const SCOPES = ['https://www.googleapis.com/auth/drive'];

// const TOKEN_PATH = paths.user.at('token.json').s;

const drive = {};

drive._ = {};

drive._.config = null;
drive._.token = {};
drive._.client = {};

drive.init = (pw) => {
    if(drive._.config) { return true; }
    if(_.isNil(pw)) { return false; }
    try {
        const eData = fs.readFileSync(paths.root.at('api-auth.json.enc').s, 'utf8');
        const data = sec.decrypt(eData, pw);
        let c = JSON.parse(data);
        drive._.config = c;
        // if(!drive.authorize()) {
        //     return {
        //         event: 'token.request',
        //         url: drive.getAuthUrl()
        //     };
        // }
        return true;
    } catch {
        return false;
    }
};

drive.authorize = async (user) => {
    if(drive._.client[user]) { return true; }
    const { client_secret, client_id, redirect_uris } = drive._.config.installed;
    drive._.client[user] = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    let token = await db.token.get(user);
    if(token) {
        drive._.token[user] = JSON.parse(token);
        drive._.client[user].setCredentials(drive._.token[user]);
        return true;
    }
    return false;
};

drive.getAuthUrl = (user) => {
    return drive._.client[user].generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
};

module.exports = drive;