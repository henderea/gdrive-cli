const _ = require('lodash');
const ipc = require('node-ipc');
const net = require('net');
const fs = require('fs');
const child_process = require('child_process');
const path = require('path');
const { REV, mode, rootPath, devLog, timeout } = require('./util');
const chalk = require('chalk');

let socketPath = '/tmp/gdrive-daemon.sock';

const funcs = {};

funcs._daemonRunning = async () => {
    if(!fs.existsSync(socketPath)) { return false; }
    return new Promise((resolve, reject) => {
        let s = net.connect(socketPath);
        s.on('connect', () => {
            s.destroy();
            resolve(true);
        });
        s.on('error', () => {
            s.destroy();
            resolve(false);
        });
    });
};

funcs.start = async () => {
    if(!await funcs._daemonRunning()) {
        if(fs.existsSync(socketPath)) {
            fs.unlinkSync(socketPath);
        }
        let daemonPath = path.join(rootPath, mode == 'dev' ? 'bin/gdrive-daemon.js' : 'dist/gdrive-daemon/index.js');
        child_process.fork(daemonPath, [], { detached: true }).unref();
        await timeout(100);
        devLog(chalk.dim(_.pad(' Started daemon ', 41, '=').slice(0, -1)));
        return true;
    }
    return false;
};

ipc.config.id = 'gdriveClient';
ipc.config.retry = 1500;
ipc.config.sync = false;
ipc.config.logger = () => { };

funcs.soc = null;

funcs.connect = async () => funcs._connect();

funcs._connect = async (firstTime = true) => {
    if(funcs.soc) { return; }
    return new Promise((resolve, reject) => {
        ipc.connectTo('gdriveDaemon', socketPath, () => {
            funcs.soc = ipc.of.gdriveDaemon;
            funcs.soc.once('connect', () => {
                devLog(chalk.dim(_.pad(' Init ', 41, '=').slice(0, -1)));
                funcs.soc.emit('init', { rev: REV });
            });
            funcs.soc.once('ready', () => {
                devLog(chalk.dim(_.pad(' Ready ', 41, '=').slice(0, -1)));
                resolve();
            });
            funcs.soc.once('restart', async (rev) => {
                devLog(chalk.dim(`Revision ${rev.rev} is different from current revision ${REV}; restarting daemon.`));
                if(firstTime) {
                    await funcs._restart();
                    resolve();
                } else {
                    devLog(chalk.dim('Unable to properly restart daemon; exiting.'));
                    process.exit(1);
                }
            });
        })
    });
};

funcs._restart = async () => {
    devLog(chalk.dim(_.pad(' Restarting ', 41, '=').slice(0, -1)));
    await funcs.__send('kill');
    ipc.disconnect('gdriveDaemon');
    funcs.soc = null;
    await timeout(100);
    await funcs.start();
    await funcs._connect(false);
}

funcs._send = async (event, data = {}) => {
    await funcs.connect();
    return funcs.__send(event, data);
};

funcs.__send = async (event, data = {}) => {
    if(funcs.soc) {
        return new Promise((resolve, reject) => {
            funcs.soc.once(event, (returnData) => {
                // devLog(chalk.dim(`Returning: ${event}, ${returnData}`))
                resolve(returnData);
            });
            // devLog(chalk.dim(`Sending: ${event}, ${data}`))
            funcs.soc.emit(event, data);
        });
    }
    return undefined;
};

funcs.kill = async () => {
    if(!await funcs._daemonRunning()) { return false; }
    await funcs.connect();
    await funcs.__send('kill');
    return true;
}

funcs.config = {};

funcs.config.getAll = async () => await funcs._send('config.getAll');

funcs.config.get = async (name) => await funcs._send('config.get', { name });

funcs.config.set = async (name, value) => await funcs._send('config.set', { name, value });

funcs.config.unset = async (name) => await funcs._send('config.unset', { name });

/* ipc.connectTo('gdriveDaemon', socketPath, () => {
    const soc = ipc.of.gdriveDaemon;
    const send = (event, data = {}) => {
        soc.emit(event, data);
    }
    soc.on('connect', () => {
        send('init');
    });
    soc.on('ready', () => {
        devLog(chalk.dim('Ready'));
        if(command == 'kill') {
            send('kill');
        } else if(command == 'getAll') {
            send('config.getAll');
        } else if(command == 'get') {
            send('config.get', { name: process.argv[3] });
        } else {
            process.exit(0);
        }
    });
    soc.on('config.getAll', (data) => {
        devLog(data.config);
        process.exit(0);
    });
    soc.on('config.get', (data) => {
        devLog(`Config '${data.name}':`, data.config);
        process.exit(0);
    });
    soc.on('die', () => {
        devLog(chalk.dim('Killed'));
        process.exit(0);
    });
}) */

module.exports = funcs;