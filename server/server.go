package server

import (
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
)

// Handle is the primary REST API for the server
// - GET  /api/ps => list of public particle systems to enter
// - POST /api/ps => create a new particle system (see other redirect)
// - GET  /api/ps/<ps_id> => join a particular particle system
// - DEL  /api/ps/<ps_id> => remove a ps
// - PUT  /api/ps/<ps_id> => configure a ps
// - WS   /api/ws/<ps_id> => listen to room updates
func Handle() http.Handler {
	s := &server{
		mux:     http.NewServeMux(),
		systems: make(map[string]*ps),
	}
	s.mux.HandleFunc("/api/ps", s.lobby)
	s.mux.HandleFunc("/api/ps/", s.room)
	s.mux.HandleFunc("/api/ws/", s.sock)
	return s.mux
}

func genUUID() string {
	// TODO: do a cool naming thing like the way docker containers are named
	out, err := exec.Command("uuidgen").Output()
	if err != nil {
		log.Fatal(err)
	}
	return string(out[:len(out)-2])
}

type server struct {
	mux     *http.ServeMux
	systems map[string]*ps
}

type ps struct {
	ID string `json:"id"`
}

// lobby provides lobby endpoints
func (s *server) lobby(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		enc := json.NewEncoder(w)
		enc.SetIndent("", " ")
		enc.Encode(s.systems)
	case http.MethodPost:
		id := genUUID()
		s.systems[id] = &ps{
			ID: id, // TODO: get name from post
		}
		// TODO: start the particle system
		http.Redirect(w, r, "/api/ps/"+id, http.StatusSeeOther)
	default:
		http.Error(w, "bad method", http.StatusMethodNotAllowed)
	}
}

// room provides room endpoints
func (s *server) room(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[8:]
	room, ok := s.systems[id]
	if !ok {
		log.Printf("nope: %q %#v", r.URL.Path, s.systems)
		http.Error(w, "bad room", http.StatusGone)
		return
	}
	switch r.Method {
	case http.MethodGet:
		enc := json.NewEncoder(w)
		enc.SetIndent("", " ")
		enc.Encode(room)
	case http.MethodPut:
		http.Error(w, "TODO: not yet", http.StatusNotImplemented)
	case http.MethodDelete:
		delete(s.systems, id)
		http.Error(w, "deleted "+id, http.StatusAccepted)
	default:
		http.Error(w, "bad method", http.StatusMethodNotAllowed)
	}
}

func (s *server) sock(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "TODO: not yet", http.StatusNotImplemented)
}
