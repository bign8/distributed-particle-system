// Package sock is the websoket package you have all been waiting for!
package sock

import (
	"errors"
	"time"
)

const (
	rpcReqPrefix = "rpc.req."
	rpcResPrefix = "rpc.res."
)

// Context mirrors context.Context (but with fewer imports)
type Context interface {
	Deadline() (deadline time.Time, ok bool)
	Done() <-chan struct{}
	Err() error
	Value(key interface{}) interface{}
}

// Connection is the core communication interface we will communicate over
type Connection interface {
	OnClose(func())
	OnData(func([]byte))
	Send([]byte) error
	Close() error
}

// Constructor is what is called when recreating Websockets
type Constructor func(addr string) (Connection, error)

// New builds a new Sock that performs automatic retires on connection failures
func New(addr string, builder Constructor) *Sock {
	// TODO: fun connection logic
	return &Sock{}
}

// Sock is a wrapper for all RPC and pub-sub style communication
type Sock struct {
	Conn      Connection
	Listeners map[string]func([]byte)
}

func (s *Sock) genID() string {
	return "01234567" // NOTE: should always be len(8) so decoding is consistent
}

// RPC executes an RPC
func (s *Sock) RPC(ctx Context, name string, data []byte) ([]byte, error) {
	resc := make(chan []byte, 1)
	defer close(resc) // yay memory leaks

	// Generate response subscription
	reply := s.genID()
	sub, err := s.Subscribe(rpcResPrefix+reply, func(res []byte) { resc <- res })
	if err != nil {
		return nil, err
	}
	defer sub.Unsubscribe() // TODO: log error here

	// Add reply channel to the request
	message := append([]byte(reply), data...) // TODO: send timeout too

	// Publish request to the cloud
	if err := s.Publish(rpcReqPrefix+name, message); err != nil {
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
		if bits[0] == 1 {
			return bits[1:], nil
		}
		return nil, errors.New(string(bits[1:]))
	case <-time.After(after):
		return nil, errors.New("Request Timeout")
	}
}

// HostRPC provides a response to a fn
func (s *Sock) HostRPC(name string, fn func(Context, []byte) ([]byte, error)) (*Stream, error) {
	return s.Subscribe(rpcReqPrefix+name, func(data []byte) {
		id := string(data[:8])
		res, err := fn(nil, data[8:]) // TODO: pass in context
		if err != nil {
			res = append([]byte{0}, []byte(err.Error())...)
		} else {
			res = append([]byte{1}, res...)
		}
		s.Publish(rpcResPrefix+id, res) // TODO: handle error here
	})
}

// Stream lets you listen to multiple messages on a socket
type Stream struct {
	kill func() error
}

// Subscribe to a given broadcast channel
func (s *Sock) Subscribe(name string, cb func([]byte)) (*Stream, error) {
	checkPubSubName(name)
	s.Listeners[name] = cb
	return &Stream{
		kill: func() error {
			delete(s.Listeners, name)
			return nil
		},
	}, nil
}

// Unsubscribe from a process stream
func (s *Stream) Unsubscribe() (err error) {
	if s.kill != nil {
		err = s.kill()
		s.kill = nil
	}
	return err
}

// Publish some data!
func (s *Sock) Publish(name string, data []byte) error {
	checkPubSubName(name)
	v := len(name) // Thanks binary.LittleEndian
	message := append([]byte{byte(v), byte(v >> 8)}, data...)
	return s.Conn.Send(message)
}

func checkPubSubName(name string) {
	if len(name) > 16 {
		panic("Publish name too long: '" + name + "' > 16")
	}
}
