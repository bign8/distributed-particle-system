package main

import (
	"crypto/rand"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var (
	portInt  = flag.Int("port", 8080, "Port server is served on")
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
)

func check(err error) {
	if err != nil {
		panic(err)
	}
}

type core struct {
	memory map[string]bool
}

// newUUID generates a random UUID according to RFC 4122
func newUUID() string {
	uuid := make([]byte, 16)
	n, err := io.ReadFull(rand.Reader, uuid)
	if n != len(uuid) || err != nil {
		panic(err)
	}
	uuid[8] = uuid[8]&^0xc0 | 0x80 // variant bits; see section 4.1.1
	uuid[6] = uuid[6]&^0xf0 | 0x40 // version 4 (pseudo-random); see section 4.1.3
	return fmt.Sprintf("%x-%x-%x-%x-%x", uuid[0:4], uuid[4:6], uuid[6:8], uuid[8:10], uuid[10:])
}

func (c *core) register() (string, func()) {
	id := newUUID()
	log.Printf("Registering: %q", id)
	c.memory[id] = true
	return id, func() {
		log.Printf("Removing: %q", id)
		delete(c.memory, id)
	}
}

// var ws = new WebSocket("ws://localhost:3000/api/brain"); ws.addEventListener('open', function (event) { console.log(event); }); ws.addEventListener('message', function (e) { console.log(e); });

func (c *core) brain(w http.ResponseWriter, r *http.Request) {
	id, done := c.register()
	defer done()
	log.Printf("Headers: %#v", r.Header)
	conn, err := upgrader.Upgrade(w, r, http.Header{
		"dps-id": {id},
	})
	check(err)
	conn.WriteJSON(id)
	for {
		messageType, p, err := conn.ReadMessage()
		check(err)
		check(conn.WriteMessage(messageType, p))
	}
}

// func (c *core) admin(w http.ResponseWriter, r *http.Request) {
// 	conn, err := upgrader.Upgrade(w, r, nil)
// 	check(err)
// 	for {
// 		messageType, p, err := conn.ReadMessage()
// 		check(err)
// 		check(conn.WriteMessage(messageType, p))
// 	}
// }

func main() {
	server := &core{
		memory: make(map[string]bool),
	}
	http.HandleFunc("/api/brain", server.brain)
	// http.HandleFunc("/api/admin", server.admin)
	http.Handle("/", http.FileServer(http.Dir("./client")))

	flag.Parse()
	port := fmt.Sprintf(":%d", *portInt)
	fmt.Println("Serving on " + port)
	check(http.ListenAndServe(port, nil))
}
