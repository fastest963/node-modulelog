# modulelog #

A library that allows easy userland swapping of different logging libraries.

By default it uses the built-in `util.debuglog` but any npm module can be
required and used, provided it has at least some of `warn`, `info`, `error`,
`debug` methods that it exposes on its exports. `console` can also be used,
except that no `debug` methods will be logged.

### Usage ###

```JS
var log = require('modulelog');
log.setClass('console');
function cb(err) {
    log.error("An error occured", {error: err});
}
```

A common use case would be to use [flags](https://www.npmjs.com/package/flags)
and allow the user to pass the class name via `--logger`:

```JS
var log = require('modulelog'),
    flags = require('flags');
flags.defineString('logger', 'debug', 'Your name');
flags.parse();
log.setClass(flags.get('logger'));
```

## Methods ##

### log.setClass(name) ###

Change the default logging library to be `name`. Built-in values are `default`,
`debuglog`, `console`. If an empty string is passed in, all logs will be
discarded. Any non-built-in values will be passed to `require`.

### log.setLevel(level) ###

Calls `setLevel` on the backing library. If the library doesn't support
different levels (like `debuglog` or `console`) then this does nothing.

### log.debug(msg[, extra]...) ###
### log.info(msg[, extra]...) ###
### log.warn(msg[, extra]...) ###
### log.error(msg[, extra]...) ###

Calls the corresponding method on the backing library. It is recommended
that you call with message and an object of extra data, however any number
of arguments are accepted and passed on.

### log.fatal(msg[, extra]...) ###

Calls the corresponding method on the backing library. If the library has no
`fatal` method, then `error` is called instead. After logging, `process.exit`
is invoked.
