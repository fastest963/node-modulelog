var util = require('util'),
    noop = function() {},
    DiscardLogger = {
        info: noop,
        debug: noop,
        warn: noop,
        error: noop
    };

function wrapDebug(debug) {
    var callDebug = function(prefix) {
        return function() {
            debug.apply(null, [prefix].concat(Array.prototype.slice.call(arguments)));
        };
    };
    return {
        info: callDebug('LOG:'),
        debug: callDebug('DEBUG:'),
        warn: callDebug('WARN:'),
        error: callDebug('ERROR:')
    };
}

function Logger(logClass) {
    if (typeof logClass !== 'object' && typeof logClass !== 'function') {
        throw new Error('Invalid logging class passed');
    }
    this.backer = logClass;
}

Logger.prototype.log = function(type, args) {
    if (this.backer[type] === undefined) {
        return false;
    }
    this.backer[type].apply(this.backer, args);
    return true;
};

Logger.prototype.exit = function() {
    if (typeof process !== 'undefined' && typeof process.exit === 'function') {
        process.exit(1);
    }
};

Logger.prototype.setLevel = function(level) {
    if (typeof this.backer.setLevel !== 'function') {
        return;
    }
    this.backer.setLevel(level);
};

Logger.instance = new Logger(DiscardLogger);

Logger.setClass = function(name, moduleName) {
    var inst = DiscardLogger;
    if (name === 'console') {
        inst = console;
    } else if (name === 'default' || name === 'debuglog' || name === undefined) {
        inst = wrapDebug(util.debuglog(moduleName));
    } else if (typeof name === 'object' || typeof name === 'function') {
        inst = name;
    } else if (name !== '' && name !== 'discard') {
        inst = require(name);
    }
    //see if its a class that we have to instantiate
    if (typeof inst === 'function' && inst.info === undefined && inst.error === undefined) {
        inst = new inst();
    }
    Logger.instance = new Logger(inst);
};

Logger.setLevel = function(level) {
    Logger.instance.setLevel(level);
};

Logger.debug = function() {
    Logger.instance.log('debug', Array.prototype.slice.call(arguments));
};

Logger.info = Logger.log = function() {
    if (!Logger.instance.log('info', Array.prototype.slice.call(arguments))) {
        Logger.instance.log('log', Array.prototype.slice.call(arguments));
    }
};

Logger.warn = function() {
    Logger.instance.log('warn', Array.prototype.slice.call(arguments));
};

Logger.error = function() {
    Logger.instance.log('error', Array.prototype.slice.call(arguments));
};

Logger.fatal = function() {
    if (!Logger.instance.log('fatal', Array.prototype.slice.call(arguments))) {
        Logger.instance.log('error', Array.prototype.slice.call(arguments));
    }
    Logger.instance.exit();
};

module.exports = Logger;
