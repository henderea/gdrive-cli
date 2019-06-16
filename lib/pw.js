const keytar = require('keytar');

const SERVICE = 'gdrive-cli';

class Keychain {
    constructor(account) {
        this._account = account;
    }

    get account() {
        return this._account;
    }

    async get() {
        return keytar.getPassword(SERVICE, this.account);
    }

    async set(password) {
        return keytar.setPassword(SERVICE, this.account, password);
    }

    async remove() {
        return keytar.deletePassword(SERVICE, this.account);
    }
}

const keychain = (account) => new Keychain(account);

module.exports = keychain;