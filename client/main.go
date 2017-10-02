package main

import "github.com/gopherjs/gopherjs/js"

func main() {
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
