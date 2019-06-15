const _set = require('lodash/set');
const _isFunction = require('lodash/isFunction');

module.exports = (ipc) => {
    return (name) => {
        const h = {};
        h.name = name;
        h.handler = null;
        h.use = () => null;
        h.sync = false;
        h.isVoid = () => false;
        h.iden = () => false;
        h.rName = () => null;
        const f = () => {
            if(h.handler && h.name) {
                if(h.sync) {
                    ipc.server.on(h.name, (data, socket) => {
                        let rv = h.handler(data, socket);
                        if(h.iden(rv)) {
                            ipc.server.emit(socket, h.use(rv) || h.name, data);
                        } else if(h.isVoid(rv)) {
                            ipc.server.emit(socket, h.use(rv) || h.name);
                        } else {
                            if(h.rName(rv)) {
                                let o = {};
                                _set(o, h.rName(rv), rv);
                                rv = o;
                            }
                            ipc.server.emit(socket, h.use(rv) || h.name, rv);
                        }
                    });
                } else {
                    ipc.server.on(h.name, async (data, socket) => {
                        let rv = await h.handler(data, socket);
                        if(h.iden(rv)) {
                            ipc.server.emit(socket, h.use(rv) || h.name, data);
                        } else if(h.isVoid(rv)) {
                            ipc.server.emit(socket, h.use(rv) || h.name);
                        } else {
                            if(h.rName(rv)) {
                                let o = {};
                                _set(o, h.rName(rv), rv);
                                rv = o;
                            }
                            ipc.server.emit(socket, h.use(rv) || h.name, rv);
                        }
                    });
                }
            } else {
                throw new Error('Either the handler or the name is not defined');
            }
        };
        f.with = (handler) => {
            h.handler = handler;
            return f;
        };
        f.use = (use) => {
            let func = use;
            if(!_isFunction(func)) {
                func = () => use;
            }
            h.use = func;
            return f;
        };
        f.sync = (sync = true) => {
            h.sync = sync;
            return f;
        };
        f.isVoid = (isVoid = true) => {
            let func = isVoid;
            if(!_isFunction(func)) {
                func = () => isVoid;
            }
            h.isVoid = func;
            return f;
        };
        f.iden = (iden = true) => {
            let func = iden;
            if(!_isFunction(func)) {
                func = () => iden;
            }
            h.iden = func;
            return f;
        };
        f.rName = (rName) => {
            let func = rName;
            if(!_isFunction(func)) {
                func = () => rName;
            }
            h.rName = func;
            return f;
        }
        return f;
    };
};