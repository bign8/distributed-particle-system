/*
Notes:
	keeping all commands withing function to not effect outer document DOM
*/

$(document).ready(function() {
	var socket = io.connect('/client'), 
		resizeTimeout,
		canvas = $('#canvas').get(0),
        context = canvas.getContext('2d'),
        settings = {
        	'active': true,
        	'ballCount': 1,
        	'maxSpeed': 4,
        	'adminNumbers': false,
        	'refreshRate': 15,
        	'prettyNum': sessionStorage.prettyNum||'...',
        	'appGUID': undefined
        };
	
	// ensure canvas is pretty + to scale
    function resizeCanvas(force) {
		if (canvas.width != window.innerWidth || canvas.height != window.innerHeight || force) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			console.log('Canvas Size: ' + canvas.width + 'x' + canvas.height);
			socket.emit('resetSize', {
				'width': canvas.width,
				'height': canvas.height,
				'full': fullScreenApi.isFullScreen(),
				'GUID': settings.appGUID
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
		console.log('Connected to socket');

		// Get or verify Guids
		socket.emit('checkGUID', sessionStorage.appGUID, function(obj) {
			console.log(obj);
			sessionStorage.appGUID = obj.GUID;
			sessionStorage.prettyNum = settings.prettyNum = obj.prettyNum;
			$('#adminNum').html(settings.prettyNum);
			resizeCanvas(true);
		});
	});
	socket.on('assignSettings', function (newSettings) {
		console.log(newSettings);

		// deal with ball count - scaling screen count of balls to mimic the system
		if (settings.ballCount != newSettings.ballCount) {
			var newBallCount = Math.ceil( newSettings.ballCount * ballArray.length / settings.ballCount );
			ballArray = ballArray.slice(0, newBallCount); // contract
			for ( var i=ballArray.length; i < newBallCount; i++) ballArray[i] = createBall(); // expand
			console.log('New ball count ' + newBallCount);
		}

		// deal with active and refresh rate
		if (newSettings.refreshRate != settings.refreshRate || newSettings.active != settings.active) {
			clearInterval(renderProcess);
			if (newSettings.active) renderProcess = setInterval(ballPhysics, newSettings.refreshRate)
		}

		// show/hide admin numbers
		if (newSettings.adminNumbers) {
			$('#adminNum').html(settings.prettyNum).fadeIn();
		} else {
			$('#adminNum').fadeOut();
		}

		// hold onto persistant settings and save
		newSettings.prettyNum = settings.prettyNum;
		newSettings.GUID = settings.GUID;
		settings = newSettings;
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
	 */
	function ballPhysics(){
		for (i=0; i<ballArray.length; i++) {
			var ball = ballArray[i];

			if ( ball.y>window.innerHeight-ball.radius ||  (ball.y<ball.radius && ball.dy < 0) ) {
				ball.dx += Math.floor(Math.random()*0.2*settings.maxSpeed)-0.1*settings.maxSpeed; // fun bounce
				ball.dy  = -ball.dy;
			}
			if ( ball.x>window.innerWidth-ball.radius || (ball.x<ball.radius && ball.dx < 0) ) {
				ball.dx  = -ball.dx;
				ball.dy += Math.floor(Math.random()*0.2*settings.maxSpeed)-0.1*settings.maxSpeed; // fun bounce
			}
			ball.dx = Math.min(Math.max(ball.dx, -settings.maxSpeed), settings.maxSpeed);
			ball.dy = Math.min(Math.max(ball.dy, -settings.maxSpeed), settings.maxSpeed);
			ball.x += ball.dx;
			ball.y += ball.dy;
		}
		drawStuff();
	}
	function drawStuff(isResize) {
		context.clearRect(0, 0, window.innerWidth, window.innerHeight);

		// Draws each ball on the canvas
		for (var i=0; i<ballArray.length; i++){
			context.beginPath();
			context.fillStyle = ballArray[i].color;
			context.arc(ballArray[i].x, ballArray[i].y, ballArray[i].radius, 0, Math.PI*2, true);
			context.closePath();
			context.fill();
		}
	}
	
	// Initialize array of balls (turn into function and use with update settings)
	function createBall() {
		return {
			x:Math.random()*window.innerWidth,
			y:Math.random()*window.innerHeight,
			radius:Math.floor(Math.random()*10)+10,
			dx:Math.floor(Math.random()*2*settings.maxSpeed)-settings.maxSpeed,
			dy:Math.floor(Math.random()*2*settings.maxSpeed)-settings.maxSpeed,
			color:'#'+Math.floor(Math.random()*11184810).toString(16) // full color span multiplyer 16777215
		};
	}

	var ballArray = [createBall()];
	/*
	for (var i=0; i<settings.ballCount; i++){
		ballArray[i] = createBall();
	}//*/
	
	// Start the animation
	var renderProcess = setInterval(ballPhysics, settings.refreshRate);
});

