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
		
		// active area set
		this.offsets = [[0,0],[0,45],[0,-45],[45,0],[-45,0]];
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
			
			// Drag and drop funciton
			var move = function(dx, dy) {
				that.moveExact(obj.set, obj.set.obox.x+dx, obj.set.obox.y+dy); //obj.set.transform('T'+(obj.set.obox.x + dx)+','+(obj.set.obox.y + dy));

				var pos = obj.set.getBBox(), old = obj.dropTarget;
				for (var key in obj.set.holder)
					if ( that.dist(obj.set.holder[key], pos) + 5 < that.dist(obj.dropTarget, pos) ) 
						obj.dropTarget = obj.set.holder[key];
				if (old != obj.dropTarget) {
					if (typeof(old.hObj) != 'undefined') old.hObj.attr({fill:'none'});
					obj.dropTarget.hObj.attr({fill:'grey'});
				}
			}, start = function() {
				obj.set.toFront().attr({opacity: 0.7});
				obj.set.obox = o = obj.set.getBBox();
				
				// Render drop targets
				obj.set.holder = {};
				obj.dropTarget = {x:Infinity, y:Infinity};
				if (that.loaded.length < 1 || (that.loaded.length == 1 && that.loaded[0] == obj.set)) {

					// Only a sigle item in the set!
					var x=that.cx-obj.cx, y=that.cy-obj.cy;
					obj.dropTarget = {x:x, y:y};
					var temp = that.R.rect(x,y,40,40);
					temp.attr({'stroke-dasharray':'-', 'stroke-width':2, 'opacity':0.7, 'fill':'grey'});
					obj.set.holder[x+','+y] = {hObj:temp, x:x, y:y};
				} else {

					// Many items, draw all possible landings
					that.loaded.forEach(function(obj2){
						if (obj2 == obj.set) return;
						var box = obj2.getBBox(), list = Object.keys(obj.set.holder);

						for(var i=0; i<that.offsets.length; i++) {
							var x=Math.round(box.x+that.offsets[i][0]), y=Math.round(box.y+that.offsets[i][1]);
							if (list.indexOf(x+','+y) < 0) {
								var temp = that.R.rect(x,y,40,40);
								temp.attr({'stroke-dasharray':'-', 'stroke-width':2, 'opacity':0.7});
								obj.set.holder[x+','+y] = {hObj:temp, x:x, y:y};
							}
							// Set current drop target if necessary
							if (Math.round(obj.dropTarget.x)==x && Math.round(obj.dropTarget.y)==y) {
								obj.dropTarget = obj.set.holder[x+','+y];
								obj.dropTarget.hObj.attr({fill:'grey'});
							}
						}
					}, this);
				}
			}, end = function() {
				obj.set.attr({opacity: 1});
				var box = obj.set.getBBox(), start = obj.state;

				// Element has been moved from loading to active area
				if (Math.floor((box.x+box.x2)/2) > 55 && start == 'unloaded') {
					console.log('Screen removed from unLoaded');
					that.unLoaded.exclude(obj.set);
					that.loaded.push(obj.set);
					obj.state = 'loaded';
				}

				// Element has been moved from active to loading area
				if (Math.floor((box.x+box.x2)/2) <= 55 && that.unLoaded.items.indexOf(obj.set) == -1) {
					console.log('Screen added to unLoaded');
					that.unLoaded.push(obj.set);
					that.loaded.exclude(obj.set);
					obj.state = 'unloaded';
				}

				// state changed, re-draw scroll area
				if (start != obj.state || obj.state == 'unloaded') that.reDrawUnloadedScroll();

				// Item is in full active loading (simply move to drop target area)
				if (obj.state == 'loaded') {
					if (obj.dropTarget.x == Infinity || obj.dropTarget.y == Infinity)  return alert('Infinity Error');
					that.moveExact(obj.set, obj.dropTarget.x, obj.dropTarget.y);
				}

				// If temporary boxes were drawn, clear them
				for (var key in obj.set.holder) {
					obj.set.holder[key].hObj.remove();
					delete obj.set.holder[key];
				}

				//smashUs();
				centerUs();
			}

			// drag and drop screen actions
			obj.state = 'unloaded';
			obj.set.drag(move, start, end);

			// Cleanup Working Area - Remove Gaps
			function smashUs() {
			    //if (c.length == 0) return;
			    var xList = [], yList = [], minX=1e10, minY=1e10, temp, gapAtX = -1, gapAtY = -1, count = 0;
			    that.loaded.forEach(function(obj) {
			        temp = obj.getBBox(); temp.x = Math.round(temp.x); temp.y = Math.round(temp.y);
			        if (xList.indexOf(temp.x) < 0) { xList.push(temp.x); minX = Math.min(minX, temp.x); }
			        if (yList.indexOf(temp.y) < 0) { yList.push(Math.round(temp.y)); minY = Math.min(minY, temp.y); }
			    });
			    while (xList.length > 0 && count < 100) {
			        temp = xList.indexOf(minX);
			        if (temp > -1) xList.splice(temp,1); else gapAtX = minX; // remove item from list or stor gap
			        minX = Math.round(minX + 60); count++;     
			    }// console.log((gapAtX > -1)?'has gap x':'no gap x');
			    count = 0;
			    while (yList.length > 0 && count < 100) {
			        temp = yList.indexOf(minY);
			        if (temp > -1) yList.splice(temp,1); else gapAtY = minY;
			        minY = Math.round(minY + 60); count++;
			    }// console.log((gapAtY > -1)?'has gap y':'no gap y');
			    if (gapAtY > -1 || gapAtX > -1) {
			        var set = that.R.set();
			        that.loaded.forEach(function(obj) {
			            temp = obj.getBBox();
			            if (gapAtX>-1 && temp.x>gapAtX) set.push(obj);
			            if (gapAtY>-1 && temp.y>gapAtY) set.push(obj);
			        });
			        if (gapAtX>-1) set.animate({transform:'T-60,0...'},500,'ease-in-out',centerUs);
			        if (gapAtY>-1) set.animate({transform:'T0,-60...'},500,'ease-in-out',centerUs);
			        set.clear();
			    } else {
			        centerUs();
			    }
			}

			// Cleanup Working Area - Center in screen
			function centerUs() {
			    var sizeAll = that.loaded.getBBox();
				obj.set.undrag();
				that.loaded.animate({
					transform: 'T'+(that.cx-sizeAll.x-sizeAll.width/2)+','+(that.cy-sizeAll.y-sizeAll.height/2)+'...'
				}, 1000, 'ease-in-out', function() {
			        obj.set.drag(move, start, end);
			    });
			};

			// Finalize adding an element to the screen
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
			that.moveExact(this.scroll,50,5);
		}
		this.scrollShowing = show;
	},
	'dist': function(obj1,obj2) {
	    return Math.sqrt(Math.pow(obj1.x-obj2.x,2)+Math.pow(obj1.y-obj2.y,2));
	},
	'moveExact': function(obj, x, y) {
		var box = obj.getBBox();
		obj.transform('T'+(x-box.x)+','+(y-box.y) + '...');
	}
};