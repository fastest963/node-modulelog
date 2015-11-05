var log = require('../log.js'),
    lastWrite = '';

exports.discard = function(test) {
    var oldLog = console.log;
    console.log = function(string) {
        lastWrite = string;
    };
    log.setClass('discard');
    lastWrite = '';
    log.error('test');
    console.log = oldLog;
    test.equal(lastWrite, '');
    test.done();
};

exports.console = function(test) {
    var oldWarn = console.warn;
    console.warn = function(string) {
        lastWrite = string;
    };
    log.setClass('console');
    log.warn('testConsole1');
    test.equal(lastWrite, 'testConsole1');

    log.setClass(console);
    log.warn('testConsole2');
    test.equal(lastWrite, 'testConsole2');

    console.warn = oldWarn;
    test.done();
};

exports.require = function(test) {
    var llog = require('levenlabs-log');
    llog.instance = new llog('info', {
        write: function(str) {
            lastWrite = str;
        }
    });
    log.setClass('levenlabs-log');
    log.warn('testLLog1');
    test.ok(lastWrite.indexOf('testLLog1') > -1);

    log.setClass('levenlabs-log');
    log.debug('testLLog2');
    test.ok(lastWrite.indexOf('testLLog1') > -1);

    test.done();
};

//todo: test debug
