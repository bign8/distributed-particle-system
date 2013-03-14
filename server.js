var config = require('./config/config');
var staticServer = require('node-static'); // github.com/bign8/node-static
var fileServer = new(staticServer.Server)('./www'); // create server

// Create web server
var webServer = require('http').createServer(function(req, res) {
	//console.log(req.url);
	fileServer.serve(req, res);
}).listen(config.system_port);

// Create socket server
var io = require('socket.io').listen(webServer, { // github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
	'log level': (config.is_production) ? 1 : 2,
	'browser client minification': true,
	'browser client etag': true,
	'browser client gzip': false, // wierd kill error
	'transports': ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling'],
	'heartbeat interval': 25, // this and following are defaults, testing error
	'heartbeats': true
});

// Start subClients of sockets - move to other areas once better understood
var admin = io.of('/admin');
var client = io.of('/client');
client.on('connection', function (socket) {
	socket.emit('a message', {
		that: 'only',
		'/client': 'will get'
	});
	client.emit('a message', {
		everyone: 'in', 
		'/client': 'will get'
	});
});
admin.on('connection', function (socket) {
		socket.emit('a message', {
			that: 'only',
			'/admin': 'will get'
		});
		admin.emit('a message', {
			everyone: 'in', 
			'/admin': 'will get'
		});
	});

// Show that things have begun
console.log('Application listening on http://' + (config.system_server || '*') + ":" + config.system_port + ".");