package store

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yendelevium/intercept.prism/internal/database"
)

// SpanRecord represents a span to be persisted
type SpanRecord struct {
	ID           string
	TraceID      string
	SpanID       string
	ParentSpanID string
	Operation    string
	ServiceName  string
	StartTime    int64
	Duration     int64
	Status       string
	Tags         map[string]string
}

// Type implements Record interface
func (r *SpanRecord) Type() string { return "Span" }

// GetID implements Record interface
func (r *SpanRecord) GetID() string { return r.ID }

// Write implements Record interface
func (r *SpanRecord) Write() error {
	queries := database.GetQueries()
	if queries == nil {
		log.Printf("No DB connection, skipped insert for %v %v", r.Type(), r.ID)
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var tagsJSON []byte
	if r.Tags != nil {
		tagsJSON, _ = json.Marshal(r.Tags)
	}

	params := database.InsertSpanParams{
		ID:          r.ID,
		TraceId:     r.TraceID,
		SpanId:      r.SpanID,
		Operation:   r.Operation,
		ServiceName: r.ServiceName,
		StartTime:   r.StartTime,
		Duration:    r.Duration,
	}

	if r.ParentSpanID != "" {
		params.ParentSpanId = pgtype.Text{String: r.ParentSpanID, Valid: true}
	}
	if r.Status != "" {
		params.Status = pgtype.Text{String: r.Status, Valid: true}
	}
	if tagsJSON != nil {
		params.Tags = tagsJSON
	}

	return queries.InsertSpan(ctx, params)
}

// AddSpan enqueues a span record for async persistence
func AddSpan(record SpanRecord) {
	GetStore().Enqueue(&record)
}
