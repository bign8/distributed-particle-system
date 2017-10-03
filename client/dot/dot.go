package dot

import (
	"github.com/bign8/distributed-particle-system/shared/art"
)

// Dot is a drifting
type Dot struct {
	Position art.Vector
	Velocity art.Vector
	Size     float64
}

// NewDot constructs a new dot object with random position, velocity and size
func NewDot(gen func() float64, width, height, size float64) *Dot {
	return &Dot{
		Position: art.NewVector(gen()*width, gen()*height),
		Velocity: art.NewRandom2DVector(gen()).Scale(gen()),
		Size:     gen() * size,
	}
}

// Step moves the point one step forward
func (dot *Dot) Step() art.Vector {
	return dot.Position.Add(dot.Velocity)
}
