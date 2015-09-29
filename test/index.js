var assert = require('assert'),
	request = require('request'),
	swintProcOps = require('../lib');

global.swintVar.printLevel = 5;

describe('Basic feature', function() {
	before(function(done) {
		var procOps = swintProcOps({
				server: {
					enabled: true
				},
				keyBind: {
					enabled: true
				}
			});

		procOps.start(function() {
			process.on('message', function(msg) {
				if(msg.type === 'control') {
					switch(msg.data) {
						case 'healthCheck':
							setTimeout(function() {
								process.emit('controlEnd', null, ['Process info']);
							}, 100);
							break;
						case 'softReset':
						case 'hardReset':
							setTimeout(function() {
								process.emit('controlEnd');
							}, 100);
							break;
					}
				}
			});
			done();
		});
	});

	it('should be able to respond healthCheck request and emit event', function(done) {
		request.get({
			url: 'https://localhost:33233/healthCheck?pass=SwintIsForTwins',
			strictSSL: false
		}, function(err, resp, body) {
			assert.deepEqual(JSON.parse(body), {
				success: true,
				error: '',
				data: {
					processes: ['Process info']
				}
			});
			done();
		});

		process.once('message', function(msg) {
			assert.deepEqual(msg, {
				type: 'control',
				data: 'healthCheck'
			});
		});
	});

	it('should be able to respond softReset request and emit event', function(done) {
		request.get({
			url: 'https://localhost:33233/softReset?pass=SwintIsForTwins',
			strictSSL: false
		}, function(err, resp, body) {
			assert.deepEqual(JSON.parse(body), {
				success: true,
				error: '',
				data: {
					message: "Soft reset has successfully done"
				}
			});
			done();
		});

		process.once('message', function(msg) {
			assert.deepEqual(msg, {
				type: 'control',
				data: 'softReset'
			});
		});
	});

	it('should be able to respond hardReset request and emit event', function(done) {
		request.get({
			url: 'https://localhost:33233/hardReset?pass=SwintIsForTwins',
			strictSSL: false
		}, function(err, resp, body) {
			assert.deepEqual(JSON.parse(body), {
				success: true,
				error: '',
				data: {
					message: "Hard reset has successfully done"
				}
			});
			done();
		});

		process.once('message', function(msg) {
			assert.deepEqual(msg, {
				type: 'control',
				data: 'hardReset'
			});
		});
	});

	it('should be able to respond healthCheck key and emit event', function(done) {
		setTimeout(function() {
			process.stdin.emit('keypress', null, { name: 'm' });
		}, 10);

		process.once('message', function(msg) {
			assert.deepEqual(msg, {
				type: 'control',
				data: 'healthCheck'
			});

			done();
		});
	});

	it('should be able to respond softReset key and emit event', function(done) {
		setTimeout(function() {
			process.stdin.emit('keypress', null, { name: 's' });
		}, 10);

		process.once('message', function(msg) {
			assert.deepEqual(msg, {
				type: 'control',
				data: 'softReset'
			});

			done();
		});
	});

	it('should be able to respond hardReset key and emit event', function(done) {
		setTimeout(function() {
			process.stdin.emit('keypress', null, { name: 'r' });
		}, 10);

		process.once('message', function(msg) {
			assert.deepEqual(msg, {
				type: 'control',
				data: 'hardReset'
			});

			done();
		});
	});
});
