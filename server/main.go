package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
)

var portInt = flag.Int("port", 8080, "Port server is served on")

func main() {
	flag.Parse()
	port := fmt.Sprintf(":%d", *portInt)
	fmt.Println("Serving on " + port)
	log.Fatal(http.ListenAndServe(port, http.FileServer(http.Dir("./client"))))
}
