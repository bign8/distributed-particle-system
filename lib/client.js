exports.start = function(client) {
	client.on('connection', function (socket) {
		socket.emit('a message', {
			that: 'only',
			'/client': 'will get'
		});
		client.emit('a message', {
			everyone: 'in', 
			'/client': 'will get'
		});
	});
};