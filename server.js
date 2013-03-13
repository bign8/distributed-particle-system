var config = require('./config/config');
var client = require('./lib/client');
var admin = require('./lib/admin');
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

// Start subClients of sockets
admin.start(io.of('/admin'));
client.start(io.of('/client'));

console.log('the only way to begin is to take a step');