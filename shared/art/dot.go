package art

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
		Velocity: NewRandom2DVector(gen()).Scale(gen()),
		Size:     gen()*size + size,
	}
}

// Step moves the point one step forward
func (dot *Dot) Step() Vector {
	return dot.Position.Add(dot.Velocity)
}
