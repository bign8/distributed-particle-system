// see http://www.html5canvastutorials.com/tutorials/html5-canvas-images/
// http://socket.io/#how-to-use

$(document).ready(function() {
	var socket = io.connect('/client'), 
		resizeTimeout,
		canvas = $('#canvas').get(0),
        context = canvas.getContext('2d');
	
	// ensure canvas is pretty + to scale
    function resizeCanvas(force) {
		if (canvas.width != window.innerWidth || canvas.height != window.innerHeight || force) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			console.log('Canvas Size: ' + canvas.width + 'x' + canvas.height);
			socket.emit('resetSize', {
				'width': canvas.width,
				'height': canvas.height,
				'full': fullScreenApi.isFullScreen()
			});
			drawStuff(true);
		}
    }
	
    // resize the canvas to fill browser window dynamically
	$(window).resize(function() {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(resizeCanvas, 1000);
	});
	
	// Socket communication managment
	socket.on('connect', function () {
		console.log('connected to socket');
		resizeCanvas(true);

		// Get Guids
		if (sessionStorage.appGUID) {
			socket.emit('checkGUID', sessionStorage.appGUID);
		} else {
			socket.emit('getGUID', null, function(GUID) {
				console.log(GUID);
				sessionStorage.appGUID = GUID;
			});
		}
	});
	socket.on('setState', function (state) {
		console.log(state);
		// session storage, setting guid
		switch (state.state) {
			case 'admin':
				$('#adminNum').html(state.prettyNum).fadeIn();
				break;
			case 'noadmin':
				$('#adminNum').fadeOut();
				break;
		}
		
	});
	socket.on('test', function(data) {
		console.log(data);
	});
	
	// Small full screen button for awesomeness
	if (fullScreenApi.supportsFullScreen) {
		var fsEle = $('body');
		$('#fullLink').click(function() {
			fullScreenApi.requestFullScreen(fsEle.get(0));
		});
		fsEle.bind(fullScreenApi.fullScreenEventName, function() {
			$('#fullLink').toggle(!fullScreenApi.isFullScreen());
		});
	} else {
		$('#fullLink').hide();
	}
	
	/**
	 * Your drawings need to be inside this function otherwise they will be reset when 
	 * you resize the browser window and the canvas goes will be cleared.
	 * https://developer.mozilla.org/en-US/docs/HTML/Canvas/Drawing_Graphics_with_Canvas
	 * http://www.netmagazine.com/tutorials/learning-basics-html5-canvas
	 */
	function drawStuff(isResize) {
		//context.fillStyle="#000000";
		//context.fillRect(0,0,150,75);
	}
});