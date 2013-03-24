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

var clients = {}; // list of connected clients
var screens = {}; // list of connected screen sizes
var admins = {}; // list of connected admins

client.on('connection', function(clientSocket) {
	// List of live connected clients - http://bit.ly/13mp9cO
	clients[clientSocket.id] = clientSocket;
	clientSocket.on('disconnect', function() {
		delete clients[clientSocket.id];
		delete screens[clientSocket.id];
		admin.emit('leaveScreen', clientSocket.id);
	});
	
	clientSocket.on('resetSize', function(screen) {
		screens[clientSocket.id] = screen;
		screen.id = clientSocket.id;
		admin.emit('resizeFrame', screen);
	});
});
admin.on('connection', function(adminSocket) {
	// list of live connected admins - http://bit.ly/13mp9cO
	admins[adminSocket.id] = adminSocket;
	adminSocket.on('disconnect', function() {
		delete admins[adminSocket.id];
	});
	console.log('Number of admins: ' + Object.keys(admins).length);
	
	adminSocket.emit('loadScreens', screens);
	
	adminSocket.on('setState', function(state) {
		console.log(state);
		client.emit('setState', state);
	});
});

// need hash and number...crap
function updateClientNumbers(curr) {
	var clients = client.clients();
	for(var i=0; i < clients.length; i++) {
		if (clients[i].disconnected)
			delete clients[i];
	}
	console.log(clients);
	for(var i=0; i < clients.length; i++) {
		clients[i].emit('test',i);
	}
}

// Show that things have begun
console.log('Application listening on http://' + (config.system_server || '*') + ":" + config.system_port + ".");