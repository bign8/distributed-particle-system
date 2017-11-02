package art

import "math"

// Dots is an array of Dot
type Dots struct {
	List          []*Dot
	Height, Width float64
}

// NewDots constructs an array of dots
func NewDots(gen func() float64, width, height, size float64, num int) *Dots {
	list := make([]*Dot, num)
	for i := range list {
		list[i] = NewDot(gen, width, height, size)
	}
	return &Dots{
		List:   list,
		Height: height,
		Width:  width,
	}
}

// SetSize assigns a given height and width of a given element
func (dots *Dots) SetSize(width, height float64) {
	dots.Width = width
	dots.Height = height
}

// Step moves the point one step forward
func (dots *Dots) Step(delta float64) {
	for _, dot := range dots.List {
		point := dot.Step(delta)

		// TODO: toggle step wrap logic based on configuration mode

		// Absolute values allow for resizes, pushing particles back into view
		if point[0] <= dot.Size {
			dot.Velocity[0] = math.Abs(dot.Velocity[0])
		} else if point[1] <= dot.Size {
			dot.Velocity[1] = math.Abs(dot.Velocity[1])
		} else if point[0] >= dots.Width-dot.Size {
			dot.Velocity[0] = -math.Abs(dot.Velocity[0])
		} else if point[1] >= dots.Height-dot.Size {
			dot.Velocity[1] = -math.Abs(dot.Velocity[1])
		}
	}
}

// ForEach calls fn for each dot in the set : O(n)
func (dots *Dots) ForEach(fn func(dot *Dot)) {
	for _, dot := range dots.List {
		fn(dot)
	}
}

// ForEachPair calls fn for each pair of dots in the set
// Worst = O(n*n), Average = O(n*log(n)), Best = O(n)
func (dots *Dots) ForEachPair(fn func(a, b Vector)) {
	for i, a := range dots.List {
		for _, b := range dots.List[i+1:] {
			fn(a.Position, b.Position)
		}
	}
}

// Dot is a drifting
type Dot struct {
	Position Vector
	Velocity Vector
	Size     float64
}

// NewDot constructs a new dot object with random position, velocity and size
func NewDot(gen func() float64, width, height, size float64) *Dot {
	return &Dot{
		Position: NewVector(gen()*width, gen()*height),
		Velocity: NewRandom2DVector(gen()).Scale(gen() / 16),
		Size:     gen()*size + size,
	}
}

// Step moves the point one step forward
func (dot *Dot) Step(delta float64) Vector {
	return dot.Position.Add(dot.Velocity.Copy().Scale(delta))
}
