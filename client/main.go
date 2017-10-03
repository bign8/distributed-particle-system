package main

import "github.com/gopherjs/gopherjs/js"

var (
	height, width = 0, 0
	domWindow     = js.Global.Get("window")
	domDoc        = js.Global.Get("document")
	domOpen       = get("link")
	domSave       = get("save")
	domClose      = get("close")
	domDialog     = get("dialog")
	domCanvas     = get("canvas")
	context       = domCanvas.Call("getContext", "2d")
)

func get(id string) *js.Object {
	return domDoc.Call("getElementById", id)
}

func handle(obj *js.Object, name string, fn func(*js.Object)) {
	obj.Call("addEventListener", name, fn, false)
}

func resize(o *js.Object) {
	domCanvas.Set("width", domWindow.Get("innerWidth"))
	domCanvas.Set("height", domWindow.Get("innerHeight"))
	w, h := domCanvas.Get("width").Int(), domCanvas.Get("height").Int()
	if w != width || h != height {
		print("updating size", w, h)
	}
	// if (canvas.width != window.innerWidth || canvas.height != window.innerHeight || force) {
	// 	canvas.width = window.innerWidth;
	// 	canvas.height = window.innerHeight;
	// 	console.log('Canvas Size: ' + canvas.width + 'x' + canvas.height);
	// 	socket.emit('resetSize', {
	// 		'width': canvas.width,
	// 		'height': canvas.height,
	// 		'full': fullScreenApi.isFullScreen(),
	// 		'GUID': settings.appGUID
	// 	});
	// 	drawStuff(true);
	// }
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
	resize(nil)
	handle(domWindow, "resize", resize)
	handle(domOpen, "click", open)
	handle(domSave, "click", save)
	handle(domClose, "click", close)

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
