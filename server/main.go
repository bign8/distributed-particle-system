package main

import (
	"flag"
	"fmt"
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

type core struct{}

func (c *core) brain(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	check(err)
	for {
		messageType, p, err := conn.ReadMessage()
		check(err)
		check(conn.WriteMessage(messageType, p))
	}
}

func (c *core) admin(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	check(err)
	for {
		messageType, p, err := conn.ReadMessage()
		check(err)
		check(conn.WriteMessage(messageType, p))
	}
}

func main() {
	server := &core{}
	http.HandleFunc("/api/brain", server.brain)
	http.HandleFunc("/api/admin", server.admin)
	http.Handle("/", http.FileServer(http.Dir("./client")))

	flag.Parse()
	port := fmt.Sprintf(":%d", *portInt)
	fmt.Println("Serving on " + port)
	check(http.ListenAndServe(port, nil))
}
