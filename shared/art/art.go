package art

import "math" // has browser based overrides

// Map takes n on the intervale [a,b] and maps it to the [c,d] interval
func Map(n, a, b, c, d float64) float64 {
	return ((n-a)/(b-a))*(d-c) + c
}

// Vector is a core vector structure
type Vector []float64

// NewVector constructs a new vector with component parts x, y, z
func NewVector(parts ...float64) Vector {
	return Vector(parts)
}

// NewRandom2DVector constructs a random 2d vector
// Angle should be on the [0,1) interval
func NewRandom2DVector(angle float64) Vector {
	angle *= 6.283185307179586 // Math.PI * 2
	return NewVector(math.Cos(angle), math.Sin(angle))
}

// Add applies vector u's components to vector v
func (v Vector) Add(u Vector) Vector {
	if len(v) != len(u) {
		panic("invalid vector adition")
	}
	for i := 0; i < len(v); i++ {
		v[i] += u[i]
	}
	return v
}

// Scale applies a given scale amount to a vector.
func (v Vector) Scale(n float64) Vector {
	for i := 0; i < len(v); i++ {
		v[i] *= n
	}
	return v
}

// Copy creates a copy of the base object
func (v Vector) Copy() Vector {
	u := make(Vector, len(v))
	copy(u, v)
	return u
}
