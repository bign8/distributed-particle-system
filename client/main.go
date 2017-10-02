package main

import "github.com/gopherjs/gopherjs/js"

var (
	domOpen   = get("link")
	domSave   = get("save")
	domClose  = get("close")
	domDialog = get("dialog")
	domCanvas = get("canvas")
	context   = domCanvas.Call("getContext", "2d")
)

func get(id string) *js.Object {
	return js.Global.Get("document").Call("getElementById", id)
}

func resize(fn *js.Object) {
	print("TODO: rezising shiz")
}

func open(o *js.Object) {
	print("open")
	domDialog.Get("classList").Call("remove", "hide")
	o.Call("preventDefault")
}

func save(o *js.Object) {
	print("save")
	domDialog.Get("classList").Call("add", "hide")
	o.Call("preventDefault")
}

func close(o *js.Object) {
	print("close")
	domDialog.Get("classList").Call("add", "hide")
	o.Call("preventDefault")
}

func main() {
	// Bind handlers
	js.Global.Get("window").Call("addEventListener", "resize", resize, false)
	resize(nil)
	domOpen.Call("addEventListener", "click", open, false)
	domSave.Call("addEventListener", "click", save, false)
	domClose.Call("addEventListener", "click", close, false)

	// js.Global.Get("document").Call("write", "Hello world!")
	js.Global.Set("dps", map[string]interface{}{
		"dialog": domDialog,
		"test": func() int {
			return js.Global.Get("Date").Call("now").Int()
		},
		"rand": func() float64 {
			return js.Global.Get("Math").Call("random").Float()
		},
	})
}
