// see http://www.html5canvastutorials.com/tutorials/html5-canvas-images/

$(document).ready(function() {
	socket = io.connect('http://a.h1x.com:1337/admin');
	
	socket.on('connect', function () {
		socket.emit('hi admin!');
	});

	socket.on('news', function () {
		socket.emit('woot admin');
	});
});