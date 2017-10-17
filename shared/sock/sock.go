// Package sock is the websoket package you have all been waiting for!
package sock

import (
	"errors"
	"time"
)

// Context mirrors context.Context (but with fewer imports)
type Context interface {
	Deadline() (deadline time.Time, ok bool)
	Done() <-chan struct{}
	Err() error
	Value(key interface{}) interface{}
}

// Websocket is the core communication interface we will communicate over
type Websocket interface {
	OnClose(func(interface{}))
	OnData(func(interface{}))
	Send(interface{})
}

// Constructor is what is called when recreating Websockets
type Constructor func(addr string) (Websocket, error)

// New builds a new Sock that performs automatic retires on connection failures
func New(addr string, builder Constructor) *Sock {
	return &Sock{}
}

// Sock is a wrapper for all RPC and pub-sub style communication
type Sock struct {
}

func (s *Sock) genID() string {
	return "TODO: random chanel ID generation"
}

// RPC executes an RPC
func (s *Sock) RPC(ctx Context, name string, data []byte) ([]byte, error) {
	resc := make(chan []byte, 1)
	defer close(resc) // yay memory leaks

	// Generate response subscription
	reply := "rpc.reply_" + s.genID()
	sub, err := s.Subscribe(reply, func(res []byte) {
		resc <- res
	})
	if err != nil {
		return nil, err
	}
	defer sub.Unsubscribe() // TODO: log error here

	// TODO: add reply name to request

	// Publish request to the cloud
	if err := s.Publish("rpc."+name, data); err != nil {
		return nil, err
	}

	// Pick real deadline
	after := time.Minute
	deadline, ok := ctx.Deadline()
	if ok {
		after = deadline.Sub(time.Now())
	}

	// Whichever comes first
	select {
	case bits := <-resc:
		return bits, nil
	case <-time.After(after):
		return nil, errors.New("Request Timeout")
	}
}

// HostRPC provides a response to a fn
func (s *Sock) HostRPC(name string, fn func(Context, []byte) ([]byte, error)) (*Stream, error) {
	return nil, nil
}

// Stream lets you listen to multiple messages on a socket
type Stream struct {
}

// Subscribe to a given broadcast channel
func (s *Sock) Subscribe(name string, cb func([]byte)) (*Stream, error) {
	return nil, nil
}

// Unsubscribe from a process stream
func (s *Stream) Unsubscribe() error {
	return nil
}

// Publish some data!
func (s *Sock) Publish(name string, data []byte) error {
	return nil
}
