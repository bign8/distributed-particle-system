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
		context.clearRect(0,0, window.innerWidth, window.innerHeight);	
		for(var i=0; i<ballNumber; i++){ //this is where you will have multiple balls drawn
			var ball = ballArray[i];
			
			context.beginPath();
			context.fillStyle=ball.ballColor;
			
			// Draws a circle of radius 20 at the coordinates 100,100 on the canvas
			context.arc(ball.x, ball.y, ball.ballSize, 0, Math.PI*2, true);
			context.closePath();
			context.fill();
		}
	}
	
	var ballArray = [];
	ballNumber = parseInt(prompt("How many balls"));
	
	for(var i=0; i < ballNumber; i++){
		ballArray[i] = {
			x:Math.random()*window.innerWidth,
			y:Math.random()*window.innerHeight,
			ballSize:Math.floor(Math.random()*10)+10,
			dx:Math.floor(Math.random()*20)-10,
			dy:Math.floor(Math.random()*20)-10,
			ballColor:'#'+Math.floor(Math.random()*16777215).toString(16)
		};
	}
	function ballPhysics(){
		for (i=0; i<ballArray.length; i++) {
			var ball = ballArray[i];
			if( ball.x<ball.ballSize && ball.dx < 0){
				ball.dx=-ball.dx;
			}
			if( ball.y<ball.ballSize && ball.dy < 0){
				ball.dy=-ball.dy;
			}
			if( ball.x>window.innerWidth - ball.ballSize){
				ball.dx=-ball.dx;
			}
			if( ball.y>window.innerHeight - ball.ballSize){
				ball.dy=-ball.dy;
			}
			ball.x += ball.dx;
			ball.y += ball.dy;
			ballArray[i] = ball;
			//console.log(ball);
		}
		drawStuff();
	}
	
	setInterval(ballPhysics, 10);
});

