var util = require('util'),
    debugContexts = new WeakMap(),
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
    var newDebug = {
        info: callDebug('LOG:'),
        debug: callDebug('DEBUG:'),
        warn: callDebug('WARN:'),
        error: callDebug('ERROR:')
    };
    newDebug.getLoggerForContext = function(ctx) {
        var backer = debugContexts.get(ctx);
        if (!backer) {
            backer = newDebug;
        }
        return backer;
    };
    return newDebug;
}

function Logger(logClass) {
    if (typeof logClass !== 'object' && typeof logClass !== 'function') {
        throw new Error('Invalid logging class passed');
    }
    this.backer = logClass;
    this.level = '';
}

Logger.instance = new Logger(DiscardLogger);

Logger.prototype.log = function(ctx, type, args) {
    //allow ctx to be optional
    if (arguments.length < 3 && typeof ctx === 'string') {
        args = type;
        type = ctx;
    }
    if (this.backer[type] === undefined) {
        return false;
    }
    var backer = this.backer;
    if (typeof backer.getLoggerForContext === 'function') {
        backer = backer.getLoggerForContext(ctx);
    }
    backer[type].apply(this.backer, args);
    return true;
};

Logger.prototype.exit = function() {
    if (typeof process !== 'undefined' && typeof process.exit === 'function') {
        process.exit(1);
    }
};

Logger.prototype.setLevel = function(level) {
    this.level = level;
    if (typeof this.backer.setLevel !== 'function') {
        return;
    }
    this.backer.setLevel(level);
};

function ModuleLogger(name) {
    if (!(this instanceof ModuleLogger)) {
        return new ModuleLogger(name);
    }
    this.name = name;
    debugContexts.set(this, wrapDebug(util.debuglog(name)));
}

ModuleLogger.prototype.setClass = function(name) {
    var inst = DiscardLogger;
    if (name === 'console') {
        inst = console;
    } else if (name === 'default' || name === 'debuglog' || name === undefined) {
        inst = wrapDebug(util.debuglog(this.name));
    } else if (typeof name === 'object' || typeof name === 'function') {
        inst = name;
    } else if (name !== '' && name !== 'discard') {
        inst = require(name);
    }
    //see if its a class that we have to instantiate
    if (typeof inst === 'function' && inst.info === undefined && inst.error === undefined) {
        inst = new inst();
    }
    var oldInstance = Logger.instance;
    Logger.instance = new Logger(inst);
    //if they changed the log level then keep that same level
    if (oldInstance.level !== '') {
        Logger.instance.setLevel(oldInstance.level);
    }
};

ModuleLogger.prototype.setLevel = function(level) {
    Logger.instance.setLevel(level);
};

ModuleLogger.prototype.debug = function() {
    Logger.instance.log(this, 'debug', Array.prototype.slice.call(arguments));
};

ModuleLogger.prototype.info = ModuleLogger.prototype.log = function() {
    if (!Logger.instance.log(this, 'info', Array.prototype.slice.call(arguments))) {
        Logger.instance.log(this, 'log', Array.prototype.slice.call(arguments));
    }
};

ModuleLogger.prototype.warn = function() {
    Logger.instance.log(this, 'warn', Array.prototype.slice.call(arguments));
};

ModuleLogger.prototype.error = function() {
    Logger.instance.log(this, 'error', Array.prototype.slice.call(arguments));
};

ModuleLogger.prototype.fatal = function() {
    if (!Logger.instance.log(this, 'fatal', Array.prototype.slice.call(arguments))) {
        Logger.instance.log(this, 'error', Array.prototype.slice.call(arguments));
    }
    Logger.instance.exit();
};

ModuleLogger.prototype.new = function(name) {
    return new ModuleLogger(name);
};

module.exports = ModuleLogger;
