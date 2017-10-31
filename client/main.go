package main

//go:generate gopherjs build -m -o ../client.js .

import (
	"math"

	"github.com/gopherjs/gopherjs/js"
	"github.com/gopherjs/websocket/websocketjs"

	"github.com/bign8/distributed-particle-system/client/strconv"
	"github.com/bign8/distributed-particle-system/shared/art"
)

var (
	dots      *art.Dots
	domWindow = js.Global.Get("window")
	domDoc    = js.Global.Get("document")
	domOpen   = get("link")
	domSave   = get("save")
	domClose  = get("close")
	domDialog = get("dialog")
	domCanvas = get("canvas")
	context   = domCanvas.Call("getContext", "2d")
)

func get(id string) *js.Object {
	return domDoc.Call("getElementById", id)
}

func handle(obj *js.Object, name string, fn func(*js.Object)) {
	obj.Call("addEventListener", name, fn, false)
}

func getSize(name string) int {
	v := domWindow.Get("inner" + name).Int()
	// TODO: fallback logic
	// w.innerHeight || d.documentElement && d.documentElement.clientHeight || d.body && d.body.clientHeight || 0
	return v
}

func resize(o *js.Object) {
	w, h := getSize("Width"), getSize("Height")
	domCanvas.Set("width", w*2)
	domCanvas.Get("style").Set("width", strconv.Itoa(w)+"px")
	domCanvas.Set("height", h*2)
	domCanvas.Get("style").Set("height", strconv.Itoa(h)+"px")
	context.Set("fillStyle", "rgb(150, 150, 150)") // this gets reset for some reason
	if dots != nil {
		dots.SetSize(float64(w*2), float64(h*2))
	}
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

func draw(ms *js.Object) {
	// print(ms.Float())
	context.Call("clearRect", 0, 0, dots.Width, dots.Height)
	dots.Step()

	// Drawing + Updating Circles
	dots.ForEach(func(dot *art.Dot) {
		context.Call("beginPath")
		context.Call("arc", dot.Position[0], dot.Position[1], dot.Size, 0, 6.283185307179586)
		context.Call("fill")
	})

	// Drawing Lines
	dots.ForEachPair(func(a, b art.Vector) {
		if d := math.Hypot(a[0]-b[0], a[1]-b[1]); d < 200 {
			temp := art.Map(d, 0, 200, 1, 0)
			in := js.InternalObject(temp).Call("toString").String()
			context.Set("strokeStyle", "rgba(0, 0, 0, "+in+")")
			context.Call("beginPath")
			context.Call("moveTo", a[0], a[1])
			context.Call("lineTo", b[0], b[1])
			context.Call("stroke")
		}
	})

	domWindow.Call("requestAnimationFrame", draw)
}

func main() {
	// Bind handlers
	resize(nil)
	handle(domWindow, "resize", resize)
	handle(domOpen, "click", open)
	handle(domSave, "click", save)
	handle(domClose, "click", close)

	// Setup Points
	var density = int(domCanvas.Get("width").Float() * domCanvas.Get("height").Float() / 1e4)
	rander := func() float64 {
		return js.Global.Get("Math").Call("random").Float()
	}
	print("nodes", density)
	height := domCanvas.Get("height").Float()
	width := domCanvas.Get("width").Float()
	dots = art.NewDots(rander, width, height, 5, density)

	// Pre-configure context
	context.Set("lineWidth", 0.5)
	context.Set("fillStyle", "rgb(150, 150, 150)")
	domWindow.Call("requestAnimationFrame", draw)

	// Configuration server ws
	wsHost := domDoc.Get("location").Get("origin").Call("replace", "http", "ws").String()
	ws, _ := websocketjs.New(wsHost + "/api/brain") // TODO handle error
	ws.AddEventListener("open", false, func(o *js.Object) {
		ws.Send(`{"fn": "id"}`)
	})
	ws.AddEventListener("message", false, func(o *js.Object) {
		obj := js.Global.Get("JSON").Call("parse", o.Get("data"))
		switch obj.Get("fn").String() {
		case "id":
			print("my id is:", obj.Get("data").String())
		default:
			print("unknown msg", obj)
		}
	})
	ws.AddEventListener("close", false, func(o *js.Object) {
		print("close", o)
	})
	ws.AddEventListener("error", false, func(o *js.Object) {
		print("error", o)
	})

	js.Global.Set("dps", map[string]interface{}{
		"dialog": domDialog,
		"test": func() int {
			return js.Global.Get("Date").Call("now").Int()
		},
		"rand": rander,
		"ws":   ws,
	})
}
