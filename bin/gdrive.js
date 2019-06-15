#!/usr/bin/env node

const _ = require('lodash');
const { mode, rootPath, devLog } = require('../lib/util');
const ipc = require('../lib/ipc');
const chalk = require('chalk');

let command = process.argv[2];

const run = async () => {
    if(command == 'kill') {
        let killed = await ipc.kill();
        if(killed === false) {
            devLog(chalk.dim(_.pad(' Daemon Not Running ', 41, '=').slice(0, -1)));
        } else {
            devLog(chalk.dim(_.pad(' Daemon Killed ', 41, '=').slice(0, -1)));
        }
        process.exit(0);
        return;
    }
    await ipc.start();
    await ipc.connect();
    let configs = await ipc.config.getAll();
    console.log('Configs:', JSON.stringify(configs, null, 4));

    let deleted = await ipc.config.unset('time.now');

    if(deleted) {
        devLog(chalk.dim.green(`Config property 'time.now' deleted.`));
    } else {
        devLog(chalk.dim.yellow(`Config property 'time.now' does not exist.`));
    }

    configs = await ipc.config.getAll();
    console.log('Configs:', JSON.stringify(configs, null, 4));

    await ipc.config.set('time.now', String(_.now()));

    configs = await ipc.config.getAll();
    console.log('Configs:', JSON.stringify(configs, null, 4));

    let time_now = await ipc.config.get('time.now');

    console.log("Config 'time.now':", time_now);
    process.exit();
};

run();


/* const run = async () => {
    await db.init();

    let configs = await db.config.getAll();

    console.log('Configs:', JSON.stringify(configs, null, 4));

    await db.config.unset('time.now');

    configs = await db.config.getAll();

    console.log('Configs:', JSON.stringify(configs, null, 4));

    await db.config.set('time.now', String(_.now()));

    configs = await db.config.getAll();

    console.log('Configs:', JSON.stringify(configs, null, 4));

    let time_now = await db.config.get('time.now');

    console.log("Config 'time.now':", time_now);

    await db.close();
}

run(); */