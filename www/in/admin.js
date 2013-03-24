// see http://www.html5canvastutorials.com/tutorials/html5-canvas-images/

var socket;

$(document).ready(function() {
	socket = io.connect('/admin');
	
	socket.on('connect', function() {
		console.log('socket connected');
	});
	socket.on('disconnect', function() {
		console.log('Server Lost');
	});
	socket.on('resizeFrame', function(obj) {
		console.log(obj);
		// note: can add new screens too
	});
	socket.on('loadScreens', function(screens) {
		console.log(screens);
	});
	socket.on('leaveScreen', function(id) {
		console.log('Screen left :' + id);
	});
});

Admin = {
	'setState': function(state) {
		socket.emit('setState', state);
	}
};