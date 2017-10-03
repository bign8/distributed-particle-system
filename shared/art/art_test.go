package art

import "testing"

func same(t *testing.T, a, b float64) {
	if a < b {
		a, b = b, a
	}
	if a-b > 0.0001 {
		t.Logf("Non-equal: %f != %f", a, b)
		panic("error")
	}
}

func TestMap(t *testing.T) {
	same(t, 5, Map(2, 1, 3, 0, 10))
	same(t, 7.5, Map(1, 0, 4, 10, 0))
	same(t, 2.5, Map(1, 0, 4, 0, 10))
}

func TestVector(t *testing.T) {
	vec := NewVector(1, 2)
	vec.Add(NewVector(1, 2))
	same(t, vec[0], 2)
	same(t, vec[1], 4)
	vec.Scale(0.5)
	same(t, vec[0], 1)
	same(t, vec[1], 2)
	func() {
		defer func() {
			if r := recover(); r == nil {
				t.Fatal("Call should have paniced")
			}
		}()
		vec.Add(NewVector(1337))
	}()
	vec.Add(NewRandom2DVector(0.25))
	same(t, vec[0], 1)
	same(t, vec[1], 3)
	vec.Add(NewRandom2DVector(0.75).Scale(3))
	same(t, vec[0], 1)
	same(t, vec[1], 0)
}
