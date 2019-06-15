#!/usr/bin/env node

if(process.argv[2] != '-s') {
    require('daemonize-process')();
}


const ipc = require('node-ipc');
const _ = require('lodash');
const db = require('../lib/db');
const { REV, mode, rootPath, devLog } = require('../lib/util');
const fs = require('fs');

let socketPath = '/tmp/gdrive-daemon.sock';

ipc.config.id = 'gdriveDaemon';
ipc.config.retry = 1500;
ipc.config.sync = false;
ipc.config.logger = () => { };

const handle = require('../lib/ipc-handler')(ipc);

// const handle = (name, handler) => {
//     ipc.server.on(name, async (data, socket) => {
//         let rv = await handler(data, socket);
//         ipc.server.emit(socket, name, rv);
//     })
// }

ipc.serve(socketPath, () => {
    handle('init').with(async (data) => {
        if(data.rev != REV) {
            return REV;
        }
        await db.init()
        return null;
    }).isVoid((rev) => _.isNil(rev)).rName('rev').use((rev) => _.isNil(rev) ? 'ready' : 'restart')();
    // ipc.server.on('init', async (data, socket) => {
    //     await db.init();
    //     ipc.server.emit(socket, 'ready');
    // });
    handle('kill').with(async () => {
        await db.close();
        ipc.server.broadcast('kill', true);
        ipc.server.stop();
        process.exit(0);
    }).isVoid()();
    // ipc.server.on('kill', async (data, socket) => {
    //     await db.close();
    //     ipc.server.broadcast('kill');
    //     ipc.server.stop();
    //     process.exit(0);
    // });
    handle('config.get').with(async (data) => await db.config.get(data.name))();
    /* ipc.server.on('config.get', async (data, socket) => {
        const val = await db.config.get(data.name);
        ipc.server.emit(socket, 'config.get', { name: data.name, value: val });
    }); */
    handle('config.getAll').with(async () => await db.config.getAll())();
    // ipc.server.on('config.getAll', async (data, socket) => {
    //     const config = await db.config.getAll();
    //     ipc.server.emit(socket, 'config.getAll', { config });
    // });
    handle('config.set').with(async (data) => await db.config.set(data.name, data.value)).iden()();
    // ipc.server.on('config.set', async (data, socket) => {
    //     await db.config.set(data.name, data.value);
    //     ipc.server.emit(socket, 'config.set', data);
    // });
    handle('config.unset').with(async (data) => await db.config.unset(data.name))();
    // ipc.server.on('config.unset', async (data, socket) => {
    //     let deleted = await db.config.unset(data.name);
    //     ipc.server.emit(socket, 'config.unset', _.extend({}, data, { deleted }));
    // });
});

ipc.server.start();