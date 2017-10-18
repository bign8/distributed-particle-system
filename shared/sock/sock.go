// Package sock is the communication package you have all been waiting for!
package sock

import (
	"errors"
	"math/rand"
	"time"
)

const (
	rpcReqPrefix = "rpc.req."
	rpcResPrefix = "rpc.res."

	retryCap  = 60 * 1000 // one-minute max retry
	retryBase = 50        // 50ms base retrys
)

// Common package errors
var (
	ErrClosed = errors.New("CLOSED")
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
	Bind(onChange func(isOpen bool), onData func(subject string, data []byte)) error
	Send(string, []byte) error
	Close() error
}

// Constructor is what is called when recreating Websockets
type Constructor func(addr string) (Connection, error)

// New builds a new Sock that performs automatic retires on connection failures
func New(addr string, builder Constructor) (*Sock, error) {
	sock := &Sock{
		build: builder,
		addr:  addr,
		err:   ErrClosed,
	}
	return sock, sock.start()
}

// Sock is a wrapper for all RPC and pub-sub style communication
type Sock struct {
	Conn      Connection
	Listeners map[string]func([]byte)

	build Constructor // How to construct a new Connection
	addr  string      // address of connection
	att   int         // retry attempt
	err   error       // active error
}

// retryDelay gives the current retry delay in milliseconds
// TODO: https://www.awsarchitectureblog.com/2015/03/backoff.html
// TODO: benchmark
func retryDelay(attempt int) (delay, next int) {
	delay = 1 << uint(attempt-1) // 2^retryAttp
	delay *= retryBase
	if delay > retryCap {
		delay = retryCap
	}
	return int(rand.Intn(delay)), attempt + 1
}

func (s *Sock) start() error {
	s.Conn, s.err = s.build(s.addr)
	if s.err != nil {
		return s.err
	}

	return s.Conn.Bind(func(isOpen bool) {
		if isOpen {
			s.att = 0
			s.err = nil
		} else {
			var delay int
			delay, s.att = retryDelay(s.att)
			time.Sleep(time.Duration(delay))
			s.start() // TODO: trap error
		}
	}, func(subject string, data []byte) {
		fn, ok := s.Listeners[subject]
		if !ok {
			print("Unsupported function:" + subject)
		}
		fn(data)
	})
}

func (s *Sock) genID() string {
	return "01234567" // NOTE: should always be len(8) so decoding is consistent
}

// RPC executes an RPC
func (s *Sock) RPC(ctx Context, name string, data []byte) ([]byte, error) {
	if s.err != nil || s.Conn == nil {
		return nil, s.err
	}
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
func (s *Sock) HostRPC(name string, fn func(Context, []byte) ([]byte, error)) (Stream, error) {
	if s.err != nil || s.Conn == nil {
		return nil, s.err
	}
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
type Stream func() error

// Unsubscribe from a process stream
func (s Stream) Unsubscribe() error { return s() }

// Subscribe to a given broadcast channel
func (s *Sock) Subscribe(name string, cb func([]byte)) (Stream, error) {
	if s.err != nil || s.Conn == nil {
		return nil, s.err
	}
	s.Listeners[name] = cb
	return func() error {
		delete(s.Listeners, name)
		return nil
	}, nil
}

// Publish some data!
func (s *Sock) Publish(name string, data []byte) error {
	if s.err != nil || s.Conn == nil {
		return s.err
	}
	// checkPubSubName(name)
	// v := len(name) // Thanks binary.LittleEndian
	// message := append([]byte{byte(v), byte(v >> 8)}, data...)
	return s.Conn.Send(name, data)
}

// func checkPubSubName(name string) {
// 	if len(name) > 16 {
// 		panic("Publish name too long: '" + name + "' > 16")
// 	}
// }
