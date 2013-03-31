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
		
		this.cx = (p.width-55)/2+55;
		this.cy = p.height/2;
		
		this.unLoaded = p.set();
		this.unLoadedAttr = {
			'clip-rect':('0 5 '+p.width+' '+(p.height-10))
		};
		
		this.loaded = p.set(); // unused so far
		
		// draw interface
		p.rect(1,1,p.width-2,p.height-2); // border
		p.path('M55,0V'+p.height); // load box bar
		this.scroll = p.path('M50,5V'+(p.height-5)).attr({ // unloaded scroll bar interface
			'stroke-width':5,
			'stroke-linecap':'round'
		}).hide().drag(function(dx, dy) { // move
			var next = dy-this.last;
			this.last = dy;
			this.transform('T0,'+next+'...'); // clean if happens before scale
			that.unLoaded.transform('T0,'+next*this.toScale+'...');
		}, function() { // start
			this.last = 0;
			this.toScale = -(that.scrollHeight)/(p.height-7);// TO FIX: scrolling dx scale (very close)
		}, function() { // stop
			var box = this.getBBox(),
				next = Math.min(Math.max(0, 5-box.y), p.height-box.y2-5);
			this.animate({transform:'T0,'+next+'...'}, 100); // needs to happen before scale
			that.unLoaded.animate({transform:'T0,'+next*this.toScale+'...'}, 100);
		});
	},
	'resizeScreen': function(obj) {
		if (this.screens[obj.id] == undefined) { // new screen
			var sizeX = 40, sizeY = 40, that = this;
			
			obj.cx = sizeX/2;
			obj.cy = sizeY/2;
			
			// create elements
			this.R.setStart();
			obj.rect = this.R.rect(0, 0, sizeX, sizeY).attr({
				fill:'#ddd', 
				stroke:'#ddd'
			});
			obj.text = this.R.text(Math.floor(sizeX/2), Math.floor(sizeY/2), badNumber++).attr({
				fill: '#444',
				'font-size': 20
			});
			obj.set = this.R.setFinish();
			
			obj.set.attr({
				title:(obj.width+'x'+obj.height+' @ '+(obj.full?'Fullscreen':'Browser'))
			});
			
			// hover border
			obj.set.hover(function() {
				obj.rect.animate({stroke: '#000'}, 300);
			}, function() {
				obj.rect.animate({stroke: '#ddd'}, 300);
			});
			
			// drag and drop screen actions
			obj.state = 'unloaded';
			obj.set.drag(function(dx,dy){ // move
				if (obj.state == 'unloaded') {
					obj.set.transform('T'+(obj.set.obox.x + dx)+','+(obj.set.obox.y + dy));
				} else {
					// TODO: this needs to be updated for grid transformations
					obj.set.transform('T'+(obj.set.obox.x + dx)+','+(obj.set.obox.y + dy));
				}
			},function() { // start
				obj.set.toFront().attr({opacity: 0.5});
				obj.set.obox = obj.set.getBBox();
			}, function() { // up
				obj.set.attr({opacity: 1});
				
				var box = obj.set.getBBox(), start = obj.state;
				if (Math.floor((box.x+box.x2)/2) > 55) {
					console.log('Screen removed from unLoaded');
					that.unLoaded.exclude(obj.set);
					that.loaded.push(obj.set);
					obj.state = 'loaded';
				} else if (that.unLoaded.items.indexOf(obj.set) == -1) {
					console.log('Screen added to unLoaded');
					that.unLoaded.push(obj.set);
					that.loaded.exclude(obj.set);
					obj.state = 'unloaded';
				}
				if (start != obj.state) that.reDrawUnloadedScroll();
				
				if (obj.state == 'loaded') {
					// TODO: loaded transformation operation
					moveExact(obj.set, that.cx-obj.cx, that.cy-obj.cy);
					// this is where center of mass needs to be!!
				}
			});
			
			// cleanup stuff
			this.unLoaded.push(obj.set).attr(this.unLoadedAttr);
			this.reDrawUnloadedScroll();
		} else {
			// old screen
			
		}
		this.screens[obj.id] = obj;
	},
	'leaveScreen': function(id) {
		if (this.screens[id] !== undefined) {
			this.unLoaded.exclude(this.screens[id].set);
			this.loaded.exclude(this.screens[id].set);
			this.screens[id].set.remove();
			delete this.screens[id];
			this.reDrawUnloadedScroll();
		}
	},
	'reDrawUnloadedScroll': function() {
		console.log('draw scroll');
		var sizeY = 40, newX = this.scrollShowing?5:8, box, that = this;
		
		// re-draw scroll order
		this.unLoaded.forEach(function(e, i) {
			newY = 5 + i*(sizeY+3);
			box = e.getBBox();
			e.translate(newX-box.x, newY-box.y);
			if (i == that.unLoaded.length-1) {
				that.toggleUnloadedScrolling( (newY + sizeY) >= that.R.height-5, (newY + sizeY) );
			}
		});
	},
	'toggleUnloadedScrolling': function(show, maxHeight) {
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
			// TO FIX: Scale scroll bar (might be working)
			var toScale = Math.pow(this.R.height-10,2)/(maxHeight*this.scroll.getBBox().height);
			this.scroll.transform('...s1,'+toScale+',50,5');
			moveExact(this.scroll,50,5);
		}
		this.scrollShowing = show;
	}
};
function moveExact(obj, x, y) {
    var box = obj.getBBox();
    obj.transform('t'+(x-box.x)+','+(y-box.y) + '...');
}