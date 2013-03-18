// see http://www.html5canvastutorials.com/tutorials/html5-canvas-images/

var socket;

$(document).ready(function() {
	socket = io.connect('/admin');
	
	socket.on('connect', function () {
		console.log('socket connected');
	});
});

Admin = {
	'setState': function(state) {
		socket.emit('setState', state);
	}
};