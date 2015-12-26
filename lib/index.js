'use strict';

var fs = require('fs'),
	path = require('path'),
	sprintf = require('sprintf').sprintf,
	keypress = require('keypress'),
	express = require('express'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	http = require('http'),
	https = require('https'),
	http2 = require('http2'),
	swintHelper = require('swint-helper'),
	defaultize = swintHelper.defaultize;

module.exports = function(options) {
	defaultize({
		server: {
			enabled: false,
			port: 33233,
			secure: true,
			http2: false,
			pass: 'SwintIsForTwins',
			certs: {
				key: fs.readFileSync(path.join(__dirname, '../test_certs/localhost.key'), 'utf-8'),
				cert: fs.readFileSync(path.join(__dirname, '../test_certs/localhost.crt'), 'utf-8'),
				ca: []
			}
		},
		keyBind: {
			enabled: false,
			monitor: 'm',
			softReset: 's',
			hardReset: 'r'
		}
	}, options);

	return new operator(options);
};

var operator = function(options) {
	this.options = options;
	this.server = null;
};

var _ = operator.prototype;

_.start = function(callback) {
	var options = this.options;

	if (callback === undefined) {
		callback = function() {};
	} 

	if (options.server.enabled) {
		this.setServer(options.server, callback);
	}
	if (options.keyBind.enabled) {
		this.setKeyBind(options.keyBind, callback);
	}
};

_.setServer = function(cfg, callback) {
	var app = express(),
		server,
		that = this;

	if (cfg.http2) {
		if (cfg.secure) {
			server = http2.createServer({
				key: cfg.certs.key,
				cert: cfg.certs.cert,
				ca: cfg.certs.ca
			}, app);
		} else {
			server = http2.raw.createServer(app);
		}
	} else {
		if (cfg.secure) {
			server = https.createServer({
				key: cfg.certs.key,
				cert: cfg.certs.cert,
				ca: cfg.certs.ca
			}, app);
		} else {
			server = http.createServer(app);
		}
	}

	server.listen(cfg.port, function() {
		print(sprintf(
			'Admin server running. Port: %s', cfg.port
		));
		that.setApp(app, cfg);
		that.server = server;

		if (!that.options.keyBind.enabled) {
			callback(null, true);
		}
	});
};

_.stopServer = function(cb) {
	if (this.server === null) {
		cb(null, true);
		return;
	}

	this.server.close(function() {
		cb(null, true);
	});
};

_.setApp = function(app, cfg) {
	var that = this;

	app.use(bodyParser.json());
	app.use(methodOverride());

	app.use(function(req, res, next) {
		if (req.query.pass === cfg.pass) {
			next();
		} else {
			res.json({
				success: false,
				error: 'Invalid password',
				data: {}
			});
		}
	});

	app.get('/healthCheck', function(req, res) {
		process.once('controlEnd', function(err, results) {
			if (err) {
				print(4, err);
				return;
			}

			res.json({
				success: true,
				error: '',
				data: {
					processes: results
				}
			});
		});

		that._emitControl('healthCheck');
	});

	app.get('/softReset', function(req, res) {
		process.once('controlEnd', function(err) {
			if (err) {
				print(4, err);
				return;
			}
			res.json({
				success: true,
				error: '',
				data: {
					message: 'Soft reset has successfully done'
				}
			});
		});

		that._emitControl('softReset');
	});

	app.get('/hardReset', function(req, res) {
		process.once('controlEnd', function(err) {
			if (err) {
				print(4, err);
				return;
			}
			res.json({
				success: true,
				error: '',
				data: {
					message: 'Hard reset has successfully done'
				}
			});
		});

		that._emitControl('hardReset');
	});
};

_.setKeyBind = function(cfg, callback) {
	var that = this,
		stdin = process.stdin;

	keypress(stdin);

	if (stdin.setRawMode) {
		stdin.setRawMode(true);
		stdin.resume();

		stdin.removeAllListeners('keypress');

		stdin.on('keypress', function(chunk, key) {
			if (key && key.name.toUpperCase() == 'C' && key.ctrl) {
				process.exit();
			} else if (key) {
				if (key.name === cfg.monitor) {
					that._emitControl('healthCheck');
					process.once('controlEnd', function(err, results) {
						if (err) {
							print(4, err);
							return;
						}
						print(3, results);
					});
				} else if (key.name === cfg.softReset) {
					that._emitControl('softReset');
					process.once('controlEnd', function(err) {
						if (err) {
							print(4, err);
							return;
						}
						print(3, 'Soft reset fired');
					});
				} else if (key.name === cfg.hardReset) {
					that._emitControl('hardReset');
					process.once('controlEnd', function(err) {
						if (err) {
							print(4, err);
							return;
						}
						print(3, 'Hard reset fired');
					});
				}
			}
		});
	}

	callback(null, true);
};

_._emitControl = function(data) {
	process.emit('message', {
		type: 'control',
		data: data
	});
};

