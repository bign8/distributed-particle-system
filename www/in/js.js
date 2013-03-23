// see http://www.html5canvastutorials.com/tutorials/html5-canvas-images/
// http://socket.io/#how-to-use

$(document).ready(function() {
	var socket = io.connect('/client');
	
	socket.on('connect', function () {
		console.log('connected to socket');
	});

	socket.on('setState', function (state) {
		console.log(state);
		switch (state) {
			case 'admin':
				$('#adminNum').html(Math.floor(Math.random()*100)).fadeIn();
				break;
			case 'run':
				$('#adminNum').fadeOut();
				break;
		}
		
	});
	
	socket.on('test', function(data) {
		console.log(data);
	});
	
	// ensure canvas is pretty + to scale
	var canvas = $('#canvas').get(0),
        context = canvas.getContext('2d');

    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
		if (canvas.width != window.innerWidth || canvas.height != window.innerHeight) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			console.log('Canvas Size: ' + canvas.width + 'x' + canvas.height);
			drawStuff();
		}
    }
    resizeCanvas();
	
	/**
	 * Your drawings need to be inside this function otherwise they will be reset when 
	 * you resize the browser window and the canvas goes will be cleared.
	 */
	function drawStuff() {
		// see this site for drawing samples - http://www.netmagazine.com/tutorials/learning-basics-html5-canvas
		context.fillStyle="#FF0000";
		context.fillRect(0,0,150,75);
	}
	
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
});