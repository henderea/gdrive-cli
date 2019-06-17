const _ = require('lodash');
const ipc = require('node-ipc');
const net = require('net');
const fs = require('fs');
const child_process = require('child_process');
const { REV, mode, paths, devLog, timeout } = require('./util');
const chalk = require('chalk');
const inquirer = require('inquirer');

const prompt = inquirer.createPromptModule();

const funcs = {};

funcs._ = {};

funcs._.daemonRunning = async () => {
    if(!fs.existsSync(paths.socket)) { return false; }
    return new Promise((resolve, reject) => {
        let s = net.connect(paths.socket);
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
    if(!await funcs._.daemonRunning()) {
        if(fs.existsSync(paths.socket)) {
            fs.unlinkSync(paths.socket);
        }
        let daemonPath = paths.root.at(mode == 'dev' ? 'bin/gdrive-daemon.js' : 'dist/gdrive-daemon/index.js').s;
        child_process.fork(daemonPath, [], { detached: true }).unref();
        await timeout(100);
        // devLog(chalk.dim(_.pad(' Started daemon ', 41, '=').slice(0, -1)));
        devLog.eCen.dim('Started Daemon');
        return true;
    }
    return false;
};

ipc.config.id = 'gdriveClient';
ipc.config.retry = 1500;
ipc.config.sync = false;
ipc.config.logger = () => { };

funcs.soc = null;

funcs.connect = async () => funcs._.connect();

funcs._.connectCleanup = () => {
    funcs.soc.off('connect', '*');
    funcs.soc.off('ready', '*');
    funcs.soc.off('restart', '*');
    funcs.soc.off('password.api.missing', '*');
}

funcs._.connect = async (firstTime = true) => {
    if(funcs.soc) { return; }
    return new Promise((resolve, reject) => {
        ipc.connectTo('gdriveDaemon', paths.socket, () => {
            funcs.soc = ipc.of.gdriveDaemon;
            funcs.soc.on('connect', () => {
                devLog.eCen.dim('Init');
                // devLog(chalk.dim(_.pad(' Init ', 41, '=').slice(0, -1)));
                funcs.soc.emit('init', { rev: REV });
            });
            funcs.soc.on('ready', () => {
                devLog.eCen.dim('Ready');
                //devLog(chalk.dim(_.pad(' Ready ', 41, '=').slice(0, -1)));
                funcs._.connectCleanup()
                resolve();
            });
            funcs.soc.on('restart', async (rev) => {
                devLog.dim(`Revision ${rev.rev} is different from current revision ${REV}; restarting daemon.`);
                if(firstTime) {
                    await funcs._.restart();
                    funcs._.connectCleanup()
                    resolve();
                } else {
                    devLog.dim('Unable to properly restart daemon; exiting.');
                    process.exit(1);
                }
            });
            funcs.soc.on('password.api.missing', async (rev) => {
                const { password } = await prompt({
                    type: 'password',
                    name: 'password',
                    message: 'Please enter the password for the google drive API auth info'
                });
                await funcs._._send('password.api.set', { password });
                funcs.soc.emit('init', { rev: REV });
            });
            // funcs.soc.on('token.request', async (data) => {
            //     console.log('You need to authenticate this tool with your google account.');
            //     console.log(`Please visit ${data.url} and authenticate with your google account.`);
            //     const { code } = await prompt({
            //         type: 'text',
            //         name: 'code',
            //         message: 'Please enter the code from that page'
            //     });
            //     await funcs._._send('token.code.set', { code });
            // });
        })
    });
};

funcs._.restart = async () => {
    devLog.eCen.dim('Restarting');
    // devLog(chalk.dim(_.pad(' Restarting ', 41, '=').slice(0, -1)));
    await funcs._._send('kill');
    ipc.disconnect('gdriveDaemon');
    funcs.soc = null;
    await timeout(100);
    await funcs.start();
    await funcs._.connect(false);
}

funcs._.send = async (event, data = {}) => {
    await funcs.connect();
    return funcs._._send(event, data);
};

funcs._._send = async (event, data = {}) => {
    if(funcs.soc) {
        return new Promise((resolve, reject) => {
            funcs.soc.once(event, (returnData) => {
                // devLog.dim(`Returning: ${event}, ${returnData}`);
                resolve(returnData);
            });
            // devLog.dim(`Sending: ${event}, ${data}`);
            funcs.soc.emit(event, data);
        });
    }
    return undefined;
};

funcs.kill = async () => {
    if(!await funcs._.daemonRunning()) { return false; }
    await funcs.connect();
    await funcs._._send('kill');
    return true;
}

funcs.config = {};

funcs.config.getAll = async () => await funcs._.send('config.getAll');

funcs.config.get = async (name) => await funcs._.send('config.get', { name });

funcs.config.set = async (name, value) => await funcs._.send('config.set', { name, value });

funcs.config.unset = async (name) => await funcs._.send('config.unset', { name });

/* ipc.connectTo('gdriveDaemon', paths.socket, () => {
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