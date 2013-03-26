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
		if (this.screens[obj.id] == undefined) { // new screen
			var sizeX = 40, sizeY = 40,
				newX = Math.floor(Math.random()*(this.obj.width()-sizeX)),
				newY = Math.floor(Math.random()*(this.obj.height()-sizeY));
			
			// create elements
			this.R.setStart();
			obj.rect = this.R.rect(newX, newY, sizeX, sizeY).attr({
				fill:'#ddd', 
				stroke:'none'
			});
			obj.text = this.R.text(newX + Math.floor(sizeX/2), newY + Math.floor(sizeY/2), '99').attr({
				fill: '#444',
				'font-size': 20
			});
			obj.set = this.R.setFinish();
			
			// hover border
			obj.set.hover(function() {
				obj.rect.attr({stroke: '#000'});
			}, function() {
				obj.rect.attr({stroke: 'none'});
			});
			
			// drag and drop actions
			obj.set.drag(function(dx,dy){ // move
				obj.set.forEach(function(e){
					e.attr({x: e.ox + dx, y: e.oy + dy});
				});
			},function() { // start
				obj.set.forEach(function(e){
					e.ox = e.attr("x");
					e.oy = e.attr("y");
				}).toFront().attr({opacity: 0.5});
			}, function() { // up
				obj.set.attr({opacity: 1});
			});
		} else { // old screen
		
		}
		this.screens[obj.id] = obj;
	},
	'leaveScreen': function(id) {
		if (this.screens[id] !== undefined) {
			this.screens[id].c.remove();
			this.screens[id].t.remove();
			delete this.screens[id];
		}
	}
};