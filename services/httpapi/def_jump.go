package httpapi

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"sourcegraph.com/sourcegraph/sourcegraph/api/sourcegraph"
	"sourcegraph.com/sourcegraph/sourcegraph/app/router"
	"sourcegraph.com/sourcegraph/sourcegraph/pkg/conf/universe"
	"sourcegraph.com/sourcegraph/sourcegraph/pkg/handlerutil"
	"sourcegraph.com/sourcegraph/sourcegraph/pkg/langp"
)

func serveJumpToDef(w http.ResponseWriter, r *http.Request) error {
	cl := handlerutil.Client(r)

	repo, repoRev, err := handlerutil.GetRepoAndRev(r.Context(), mux.Vars(r))
	if err != nil {
		return err
	}

	file := r.URL.Query().Get("file")

	line, err := strconv.Atoi(r.URL.Query().Get("line"))
	if err != nil {
		return err
	}

	character, err := strconv.Atoi(r.URL.Query().Get("character"))
	if err != nil {
		return err
	}

	var response = &struct {
		Path string `json:"path"`
	}{}

	if universe.Enabled(r.Context(), repo.URI) {
		defRange, err := langp.DefaultClient.Definition(r.Context(), &langp.Position{
			Repo:      repo.URI,
			Commit:    repoRev.CommitID,
			File:      file,
			Line:      line,
			Character: character,
		})
		universeObserve("Definition", err)
		if err != nil {
			return err
		}
		if defRange.File == "." {
			// Special case the top level directory
			response.Path = router.Rel.URLToRepoTreeEntry(defRange.Repo, defRange.Commit, "").String()
		} else {
			// We increment the line number by 1 because the blob view is not zero-indexed.
			response.Path = router.Rel.URLToBlobRange(defRange.Repo, defRange.Commit, defRange.File, defRange.StartLine+1, defRange.EndLine+1, defRange.StartCharacter+1, defRange.EndCharacter+1).String()
		}
		return writeJSON(w, response)
	} else if universe.Shadow(repo.URI) {
		go func() {
			_, err := langp.DefaultClient.Definition(r.Context(), &langp.Position{
				Repo:      repo.URI,
				Commit:    repoRev.CommitID,
				File:      file,
				Line:      line,
				Character: character,
			})
			universeObserve("Definition", err)
		}()
	}

	defSpec, err := cl.Annotations.GetDefAtPos(r.Context(), &sourcegraph.AnnotationsGetDefAtPosOptions{
		Entry: sourcegraph.TreeEntrySpec{
			RepoRev: repoRev,
			Path:    file,
		},
		Line:      uint32(line),
		Character: uint32(character),
	})
	if err != nil {
		return err
	}
	// We still need the string name (not the UID) of the repository to send back.
	def, err := cl.Defs.Get(r.Context(),
		&sourcegraph.DefsGetOp{
			Def: sourcegraph.DefSpec{
				Repo:     defSpec.Repo,
				CommitID: defSpec.CommitID,
				UnitType: defSpec.UnitType,
				Unit:     defSpec.Unit,
				Path:     defSpec.Path},
			Opt: &sourcegraph.DefGetOptions{ComputeLineRange: true}})
	if err != nil {
		return err
	}

	response.Path = router.Rel.URLToBlob(def.Repo, def.CommitID, def.File, int(def.StartLine)).String()
	return writeJSON(w, response)
}
