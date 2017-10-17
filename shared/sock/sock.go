// Package sock is the websoket package you have all been waiting for!
package sock

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

// RPC executes an RPC
func (s *Sock) RPC(name string, args interface{}) (interface{}, error) {
	return nil, nil
}

// HostRPC provides a response to a fn
func (s *Sock) HostRPC(name string, fn func(interface{}) (interface{}, error)) {

}

type Stream struct {
}

func (s *Sock) Subscribe(name string) (*Stream, error) {
	return nil, nil
}

func (s *Stream) Unsubscribe() error {
	return nil
}

func (s *Sock) Publish(name string, data interface{}) error {
	return nil
}
