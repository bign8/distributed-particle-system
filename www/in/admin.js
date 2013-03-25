// see http://www.html5canvastutorials.com/tutorials/html5-canvas-images/

var socket;

$(document).ready(function() {
	socket = io.connect('/admin');
	ScreenManager.initManager('screenLayout');
	
	socket.on('connect', function() {
		console.log('socket connected');
	});
	socket.on('disconnect', function() {
		console.log('Server Lost');
	});
	socket.on('resizeFrame', function(obj) {
		console.log(obj);
		ScreenManager.resizeScreen(obj);
		// note: can add new screens too
	});
	socket.on('loadScreens', function(screens) {
		console.log(screens);
		for (var i in screens) {
			ScreenManager.resizeScreen(screens[i]);
		}
		// loop through and add screens
	});
	socket.on('leaveScreen', function(id) {
		console.log('Screen left :' + id);
		ScreenManager.leaveScreen(id);
	});
});

Admin = {
	'setState': function(state) {
		socket.emit('setState', state);
	}
};

ScreenManager = {
	'screens': {},
	'initManager': function(obj) {
		this.obj = $('#' + obj);
		this.R = Raphael(obj, this.obj.width(), this.obj.height());
	},
	'resizeScreen': function(obj) {
		if (this.screens[obj.id] == undefined) {
			var sizeX = 50, sizeY = 50,
				newX = Math.floor(Math.random()*(this.obj.width()-sizeX)),
				newY = Math.floor(Math.random()*(this.obj.height()-sizeY));
			obj.c = this.R.rect(newX,newY,sizeX, sizeY).attr({
				fill: '#555',
				stroke: 'none'
			});
			obj.c.drag(function(dx, dy) { // move
				this.attr({x: this.ox + dx, y: this.oy + dy});
			}, function() { // start
				this.ox = this.attr('x');
				this.oy = this.attr('y');
				this.attr({opacity: 0.5});
			}, function() { // stop
				this.attr({opacity: 1});
			});
			
		}
		this.screens[obj.id] = obj;
	},
	'leaveScreen': function(id) {
		if (this.screens[id] !== undefined) {
			this.screens[id].c.remove();
			delete this.screens[id];
		}
	}
};