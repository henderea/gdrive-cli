const _ = require('lodash');
const db = require('../lib/db');


const run = async () => {
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

run();