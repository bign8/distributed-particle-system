exports.start = function(admin) {
	admin.on('connection', function (socket) {
		socket.emit('a message', {
			that: 'only',
			'/admin': 'will get'
		});
		admin.emit('a message', {
			everyone: 'in', 
			'/admin': 'will get'
		});
	});
};