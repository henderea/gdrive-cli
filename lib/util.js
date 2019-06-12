const fs = require('fs');
const path = require('path');

let rootPath = path.join(__dirname, '..');

module.exports.rootPath = rootPath;

let env;
if(fs.existsSync(path.join(rootPath, '.env.json'))) {
    env = JSON.parse(fs.readFileSync(path.join(rootPath, '.env.json'), { encoding: 'utf8' }));
} else {
    env = {
        mode: 'prod'
    };
}

module.exports.env = env;

const devLog = function() {
    if(env.mode == 'dev') {
        console.log.apply(null, arguments);
    }
};

module.exports.devLog = devLog;