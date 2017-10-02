distributed-particle-system
===========================
A Node.js based web application to distribute a particle system across multiple systems

#Installation Process
Execute these commands to fully and automatically install the distributed particle system.
```sh
git clone git://github.com/bign8/distributed-particle-system.git
cd distributed-particle-system
npm install
```

##Configuration Notes
The configuration file is stored in `config/config.js` and appears as follows.
```js
module.exports = config = {
  // System Configuration
  "system_name"   : "CS-389 Distributed Particle System",
  "system_server" : "*",
  "system_port"   : 83,

  // Misc Configuration
  "is_production" : true
};
```
###`system_name`:string
Holds the name of the application and is loaded on runtime of the application
###`system_server`:string
Holds the ip-address or hostname of the server
###`system_port`:int
Holds the port to start the server on (avoid collisions)
###`is_production`:boolean
Determines the verbosity of the socket.io logging
