package main

import "github.com/gopherjs/gopherjs/js"

var canvas = js.Global.Get("document").Call("getElementById", "canvas")

func resize(fn *js.Object) {
	print("rezising shiz")
}

func main() {
	js.Global.Get("window").Call("addEventListener", "resize", resize, false)
	resize(nil)

	// js.Global.Get("document").Call("write", "Hello world!")
	js.Global.Set("dps", map[string]interface{}{
		"test": func() int {
			return js.Global.Get("Date").Call("now").Int()
		},
		"rand": func() float64 {
			return js.Global.Get("Math").Call("random").Float()
		},
	})
}
