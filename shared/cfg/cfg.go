package cfg

// Config is a core application configuration object, sent to clients.
type Config struct {
	Color int32   // color of the dots encoded in an int
	Dist  float64 // how far until dots disconnect
	Back  int32   // background color of the window
	Min   float64 // minimum size of the dots
	Max   float64 // maximum size of the dots
	Width float64 // width of connecting lines
}

// TODO: action config
// pass through walls vs. bounce on edges
// keeping window size or treat each screen the same size
