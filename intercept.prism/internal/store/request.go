package store

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yendelevium/intercept.prism/internal/database"
)

// RequestRecord represents a request to be persisted
type RequestRecord struct {
	ID           string
	Method       string
	URL          string
	Headers      map[string]string
	Body         string
	CollectionID string
	CreatedByID  string
}

// Type implements Record interface
func (r *RequestRecord) Type() string { return "Request" }

// GetID implements Record interface
func (r *RequestRecord) GetID() string { return r.ID }

// Write implements Record interface
func (r *RequestRecord) Write() error {
	queries := database.GetQueries()
	if queries == nil {
		log.Printf("No DB connection, skipped insert for %v %v", r.Type(), r.ID)
		return nil // No DB connection, silently skip
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	headersJSON, err := json.Marshal(r.Headers)
	if err != nil {
		headersJSON = []byte("{}")
	}

	var method database.HttpMethod
	switch strings.ToUpper(r.Method) {
	case "GET":
		method = database.HttpMethodGET
	case "POST":
		method = database.HttpMethodPOST
	case "PUT":
		method = database.HttpMethodPUT
	case "DELETE":
		method = database.HttpMethodDELETE
	default:
		method = database.HttpMethodGET
	}

	_, err = queries.InsertRequest(ctx, database.InsertRequestParams{
		ID:           r.ID,
		Name:         fmt.Sprintf("%s %s", r.Method, r.URL),
		Method:       method,
		Url:          r.URL,
		Headers:      headersJSON,
		Body:         pgtype.Text{String: r.Body, Valid: r.Body != ""},
		CollectionId: r.CollectionID,
		CreatedById:  r.CreatedByID,
	})
	return err
}

// AddRequest enqueues a request record for async persistence
func AddRequest(record RequestRecord) {
	GetStore().Enqueue(&record)
}
