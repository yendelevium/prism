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
    ID           string            `json:"id"`
    TraceID      string            `json:"trace_id"`
    SpanID       string            `json:"span_id"`
    ParentSpanID string            `json:"parent_span_id,omitempty"`
    Operation    string            `json:"operation"`
    ServiceName  string            `json:"service_name"`
    StartTime    int64             `json:"start_time"`
    Duration     int64             `json:"duration"`
    Status       string            `json:"status,omitempty"`
    Tags         map[string]string `json:"tags,omitempty"`
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

// GetSpansByTraceID retrieves all spans for a given trace ID
func GetSpansByTraceID(traceID string) ([]SpanRecord, error) {
	queries := database.GetQueries()
	if queries == nil {
		log.Printf("No DB connection, cannot fetch spans for traceId %s", traceID)
		return nil, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := queries.GetSpansByTraceID(ctx, traceID)
	if err != nil {
		return nil, err
	}

	result := make([]SpanRecord, 0, len(rows))

	for _, row := range rows {
		record := SpanRecord{
			ID:          row.ID,
			TraceID:     row.TraceId,
			SpanID:      row.SpanId,
			Operation:   row.Operation,
			ServiceName: row.ServiceName,
			StartTime:   row.StartTime,
			Duration:    row.Duration,
		}

		if row.ParentSpanId.Valid {
			record.ParentSpanID = row.ParentSpanId.String
		}

		if row.Status.Valid {
			record.Status = row.Status.String
		}

		if row.Tags != nil {
			var tags map[string]string
			if err := json.Unmarshal(row.Tags, &tags); err == nil {
				record.Tags = tags
			}
		}

		result = append(result, record)
	}

	return result, nil
}
