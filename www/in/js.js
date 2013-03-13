// see http://www.html5canvastutorials.com/tutorials/html5-canvas-images/
// http://socket.io/#how-to-use

$(document).ready(function() {
	var socket = io.connect('http://a.h1x.com:1337/client');
	
	socket.on('connect', function () {
		socket.emit('hi!');
	});

	socket.on('news', function () {
		socket.emit('woot');
	});
});