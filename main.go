package main

import (
	"flag"
	"fmt"
	"net/http"
	"strconv"
)

var portArg = flag.Int("port", 8080, "Port server is served on")

func main() {
	// TODO: figure out how to ship binary + style.css, index.html, client.js.map, client.js
	http.Handle("/", http.FileServer(http.Dir("")))

	flag.Parse()
	port := ":" + strconv.Itoa(*portArg)
	fmt.Println("Serving on " + port)
	http.ListenAndServe(port, nil)
}
