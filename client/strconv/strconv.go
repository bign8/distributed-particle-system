package strconv

import "github.com/gopherjs/gopherjs/js"

// Itoa converts an int into a string
// Itoa is shorthand for FormatInt(int64(i), 10).
func Itoa(a int) string {
	return js.InternalObject(a).Call("toString").String()
}
