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
var badNumber = 0;
ScreenManager = {
	'screens': {},
	'screenNumber': 0,
	'scrollShowing': false,
	'initManager': function(obj) {
		var that = this,
			o = this.obj = $('#' + obj),
			p = this.R = Raphael(obj, this.obj.width(), this.obj.height());
		
		// Note: all o.height() can be replaced with p.height, same for (this|that).obj.height() references
		
		this.unLoaded = p.set();
		this.unLoadedAttr = {
			'clip-rect':('0 5 '+this.obj.width()+' '+(this.obj.height()-10))
		};
		
		this.loaded = p.set(); // unused so far
		
		// draw interface
		p.rect(1,1,o.width()-2,o.height()-2); // border
		p.path('M55,0V'+o.height()); // load box bar
		
		this.scroll = p.path('M50,5V'+(o.height()-5)).attr({
			'stroke-width':5,
			'stroke-linecap':'round'
		}).hide().drag(function(dx, dy) { // move
			var next = dy-this.last;
			this.last = dy;
			this.transform('T0,'+next+'...'); // clean if happens before scale
			// add transform to that.unLoaded
			that.unLoaded.transform('T0,'+-next*this.toScale+'...');
		}, function() { // start
			this.last = 0;
			this.toScale = (that.scrollHeight)/(that.scroll.getBBox().height); // TO FIX: scrolling dx scale
		}, function() { // stop
			var box = this.getBBox(),
				next = Math.min(Math.max(0, 5-box.y), o.height()-box.y2-5);
			this.animate({transform:'T0,'+next+'...'}, 100); // needs to happen before scale
			that.unLoaded.animate({transform:'T0,'+-next*this.toScale+'...'}, 100);
			// add transform to that.unLoaded
		});
	},
	'resizeScreen': function(obj) {
		if (this.screens[obj.id] == undefined) { // new screen
			var sizeX = 40, sizeY = 40, that = this;
			
			// create elements
			this.R.setStart();
			obj.rect = this.R.rect(0, 0, sizeX, sizeY).attr({
				fill:'#ddd', 
				stroke:'none'
			});
			obj.text = this.R.text(Math.floor(sizeX/2), Math.floor(sizeY/2), badNumber++).attr({
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
				var box = obj.set.getBBox();
				if (Math.floor((box.x+box.x2)/2) > 55) {
					console.log('removed');
					that.unLoaded.exclude(obj.set);
				} else if (that.unLoaded.items.indexOf(obj.set) == -1) {
					that.unLoaded.push(obj.set);
				}
				that.reDrawScroll();
			});
			
			// cleanup stuff
			this.unLoaded.push(obj.set);
			this.unLoaded.attr(this.unLoadedAttr);
			this.reDrawScroll();
		} else {
			// old screen
		}
		this.screens[obj.id] = obj;
	},
	'leaveScreen': function(id) {
		if (this.screens[id] !== undefined) {
			this.unLoaded.exclude(this.screens[id].set);
			this.screens[id].set.remove();
			delete this.screens[id];
			this.reDrawScroll();
		}
	},
	'reDrawScroll': function() {
		console.log('re draw scroll');
		var sizeY = 40, newX = this.scrollShowing?5:8, box, that = this;
		
		// re-draw scroll order
		this.unLoaded.forEach(function(e, i) {
			newY = 5 + i*(sizeY+3);
			box = e.getBBox();
			e.translate(newX-box.x, newY-box.y);
			if (i == that.unLoaded.length-1) {
				that.toggleScrolling( (newY + sizeY) >= that.obj.height()-5, (newY + sizeY) );
			}
		});
	},
	'toggleScrolling': function(show, maxHeight) {
		console.log('toggleing scrolling');
		// astually toggle
		if(show && this.scrollShowing != show) {
			this.scroll.show();
			this.unLoaded.translate(-3,0);
		} else if (this.scrollShowing != show) {
			this.scroll.hide();
			this.unLoaded.translate(3,0);
		}
		
		// size scrollbar
		if (show) {
			this.scrollHeight = maxHeight;
			// TO FIX: Scale scroll bar
			var toScale = Math.pow(this.obj.height()-5,2)/(maxHeight*this.scroll.getBBox().height);
			this.scroll.scale(1,toScale,0,5);
			// re-zero scroll bar?
			this.scroll.translate(0, 5-this.scroll.getBBox().y);
		}
		this.scrollShowing = show;
	}
};