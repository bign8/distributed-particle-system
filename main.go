package main

import (
	"flag"
	"fmt"
	"net/http"
	"strconv"

	"github.com/bign8/distributed-particle-system/server"
)

var portArg = flag.Int("port", 8080, "Port server is served on")

func main() {
	// TODO: figure out how to ship binary + style.css, index.html, client.js.map, client.js
	// TODO: use http2 to push client.js and style.css to consumer (or bonus, combine assets beforehand)
	http.Handle("/", http.FileServer(http.Dir("")))
	http.Handle("/api/", server.Handle())

	flag.Parse()
	port := ":" + strconv.Itoa(*portArg)
	fmt.Println("Serving on " + port)
	http.ListenAndServe(port, nil)
}
