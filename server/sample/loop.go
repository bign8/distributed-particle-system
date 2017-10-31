package main

import (
	"log"
	"time"
)

const (
	physicsDelay   = 15 * time.Millisecond
	broadcastDelay = 45 * time.Millisecond
)

// https://getpocket.com/a/read/194421626
type server struct {
	physicsTimer, broadcastTimer *time.Timer
}

// The game server set up
// On the server, we have two updates running. The one update is run at a high frequency,
// which updates the physics and state of the game. We will call this the physics
// update loop, which is run every 15ms (about 66 updates per second). The second
// update we can call the server update loop, which is run at a slower rate, every
// 45ms (about 22 updates per second). In the server update loop we send the state
// of the server to all clients. Most of what we will implement is based on the theory
// presented in the [networking of the Source Engine from Valve Software]
// (https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking).
func (s *server) run() {
	s.physicsTimer = time.NewTimer(physicsDelay)
	s.physicsTimer.Stop()
	s.broadcastTimer = time.NewTimer(broadcastDelay)
	// s.broadcastTimer.Stop()
	go s.physics()
	go s.broadcast()
}

// The server physics loop (15ms)
// Don’t let the term physics scare you, in our example it is extremely simple linear motion.
// We take the input from the clients, and we move them according to what they pushed.
// If they press left, you move them left.
// When we add client side prediction, we need to also tell the clients which of their inputs we had processed last.
// So how does our server update the physics?
//
// - Process input that we stored from the network
// - Work out the direction they intended to move based on input stored
// - Apply the changes of this direction to the player position
// - Store the last processed input number
// - Clear any inputs that we have stored
func (s *server) physics() {
	for tick := range s.physicsTimer.C {
		s.physicsTimer.Reset(physicsDelay)
		log.Print("Physics: ", tick)
	}
}

// The server update loop (45ms)
// The update loop sends the state of the server to all clients.
// This varies per game of course, and in our example the state consists of player positions,
// the inputs of the player we have already processed (the last processed input number),
// and the local server time.
//
// What you send in the state update is up to you, and often more than one server
// update loop can be employed to lower the amount of traffic used. A simple example
// would be a day/night cycle. If the cycle was changing at a much lower rate than
// everything else, you can send the state of the sun every 5 seconds instead of every 45 ms.
func (s *server) broadcast() {
	for tick := range s.broadcastTimer.C {
		s.broadcastTimer.Reset(broadcastDelay)
		log.Print("Broadcast: ", tick)
	}
}
