package main

import (
	"math"

	"github.com/gopherjs/gopherjs/js"

	"github.com/bign8/distributed-particle-system/client/strconv"
	"github.com/bign8/distributed-particle-system/shared/art"
)

var (
	// height, width            = 0, 0
	dots []*art.Dot

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
	// if w != width || h != height {
	// 	print("updating size", w, h)
	// 	width, height = w, h
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

func draw() {
	context.Call("clearRect", 0, 0, domCanvas.Get("width"), domCanvas.Get("height"))

	// Drawing + Updating Circles: O(n)
	for _, dot := range dots {
		point := dot.Step()

		// Absolute values allow for resizes, pushing particles back into view
		if point[0] <= dot.Size {
			dot.Velocity[0] = math.Abs(dot.Velocity[0])
		} else if point[1] <= dot.Size {
			dot.Velocity[1] = math.Abs(dot.Velocity[1])
		} else if point[0] >= domCanvas.Get("width").Float()-dot.Size {
			dot.Velocity[0] = -math.Abs(dot.Velocity[0])
		} else if point[1] >= domCanvas.Get("height").Float()-dot.Size {
			dot.Velocity[1] = -math.Abs(dot.Velocity[1])
		}

		// Draw dots
		context.Call("beginPath")
		context.Call("arc", point[0], point[1], dot.Size, 0, 6.283185307179586)
		context.Call("fill")
	}

	// Drawing Lines: Worst = O(n*n), Average = O(n*log(n)), Best = O(n)
	for i := 0; i < len(dots); i++ {
		for j := i + 1; j < len(dots); j++ {
			a, b := dots[i].Position, dots[j].Position
			var d = math.Hypot(a[0]-b[0], a[1]-b[1])
			if d < 200 {
				temp := art.Map(d, 0, 200, 1, 0)
				in := js.InternalObject(temp).Call("toFixed", 2).String()
				context.Set("strokeStyle", "rgba(0, 0, 0, "+in+")")
				context.Call("beginPath")
				context.Call("moveTo", a[0], a[1])
				context.Call("lineTo", b[0], b[1])
				context.Call("stroke")
			}
		}
	}

	domWindow.Call("requestAnimationFrame", draw)
}

func mouse(o *js.Object) {
	dots[1].Position[0] = o.Get("clientX").Float() * 2
	dots[1].Position[1] = o.Get("clientY").Float() * 2
}

func main() {
	// Bind handlers
	resize(nil)
	handle(domWindow, "resize", resize)
	handle(domOpen, "click", open)
	handle(domSave, "click", save)
	handle(domClose, "click", close)
	handle(domWindow, "mousemove", mouse)

	// Setup Points
	var density = int(domCanvas.Get("width").Float() * domCanvas.Get("height").Float() / 3e4)
	dots = make([]*art.Dot, density)
	rander := func() float64 {
		return js.Global.Get("Math").Call("random").Float()
	}
	for i := 0; i < density; i++ {
		dots[i] = art.NewDot(rander, domCanvas.Get("width").Float(), domCanvas.Get("height").Float(), 5)
	}

	// Pre-configure context
	context.Set("lineWidth", 0.5)
	context.Set("fillStyle", "rgb(150, 150, 150)")
	domWindow.Call("requestAnimationFrame", draw)

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
