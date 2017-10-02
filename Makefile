PROJ=github.com/bign8/distributed-particle-system

all: client/client.js
.PHONY=all

clean:
	rm -f client/client.js client/client.js.map
.PHONY=clean

client/client.js client/client.js.map: client/main.go
	gopherjs build -o client/client.js $(PROJ)/client

watch:
	gopherjs build -w -o client/client.js $(PROJ)/client
.PHONY=watch

serve:
	go run server/main.go
.PHONY=serve
