var config = require('./config/config');
var staticServer = require('node-static'); // github.com/bign8/node-static
var fileServer = new(staticServer.Server)('./www'); // create server

// Create web server
var webServer = require('http').createServer(function(req, res) {
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
var uniqueClients = {};
var screens = {}; // list of connected screen sizes
var admins  = {}; // list of connected admins

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

	clientSocket.on('getGUID', function(undefined, fn) {
		var GUID = guid();
		// verify guid is unique
		uniqueClients[GUID] = clientSocket;
		fn(GUID);
	});
	clientSocket.on('checkGUID', function(GUID){
		// Ensure only one screen here
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
		client.socket(state.id).emit('setState', state)
	});
});

// Show that things have begun
console.log('Application listening on http://' + (config.system_server || '*') + ":" + config.system_port + ".");

// possible way to identify clients
function s4() {
	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
};
function guid() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};