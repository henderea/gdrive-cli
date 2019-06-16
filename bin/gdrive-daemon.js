#!/usr/bin/env node

const ipc = require('node-ipc');
const _ = require('lodash');
const db = require('../lib/db');
const { REV, hookOutput, paths, devLog } = require('../lib/util');
const kc = require('../lib/pw');
const drive = require('../lib/drive-api');

if(process.argv[2] != '-s') {
    require('daemonize-process')();
}

hookOutput('gdrive-daemon');
devLog.eCen.dim('Hooked');

ipc.config.id = 'gdriveDaemon';
ipc.config.retry = 1500;
ipc.config.sync = false;
ipc.config.logger = () => { };

const handle = require('../lib/ipc-handler')(ipc);

const kill = () => {
    ipc.server.broadcast('kill', true);
    ipc.server.stop();
    process.exit(0);
}

const pw = kc('apiAuthEnc');

ipc.serve(paths.socket, () => {
    handle('init')
        .pre((data) => data.rev != REV ? REV : true)
        .with(async () => {
            await db.init();
            const pass = await pw.get();
            let success = drive.init(pass);
            if(success) {
                return null;
            } else {
                return 'password.api.missing';
            }
        })
        .isVoid((rv) => _.isNil(rv) || _.isString(rv))
        .rName('rev')
        .use((rv) => _.isNil(rv) ? 'ready' : (_.isString(rv) ? rv : 'restart'))
        ();
    handle('password.api.set')
        .with(async (data) => pw.set(data.password))
        .isVoid()
        ();
    handle('kill')
        .pre(async () => { await db.close(); })
        .with(() => kill())
        .isVoid()
        ();
    handle('config.get')
        .with(async (data) => db.config.get(data.name))
        ();
    handle('config.getAll')
        .with(async () => db.config.getAll())
        ();
    handle('config.set')
        .with(async (data) => db.config.set(data.name, data.value))
        .iden()
        ();
    handle('config.unset')
        .with(async (data) => db.config.unset(data.name))
        ();
});

ipc.server.start();