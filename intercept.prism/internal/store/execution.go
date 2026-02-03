package store

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yendelevium/intercept.prism/internal/database"
)

// ExecutionRecord represents an execution to be persisted
type ExecutionRecord struct {
	ID         string
	RequestID  string
	TraceID    string
	StatusCode int
	LatencyMs  int
}

// Type implements Record interface
func (r *ExecutionRecord) Type() string { return "Execution" }

// GetID implements Record interface
func (r *ExecutionRecord) GetID() string { return r.ID }

// Write implements Record interface
func (r *ExecutionRecord) Write() error {
	queries := database.GetQueries()
	if queries == nil {
		log.Printf("No DB connection, skipped insert for %v %v", r.Type(), r.ID)
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := queries.InsertExecution(ctx, database.InsertExecutionParams{
		ID:         r.ID,
		RequestId:  r.RequestID,
		TraceId:    r.TraceID,
		StatusCode: pgtype.Int4{Int32: int32(r.StatusCode), Valid: true},
		LatencyMs:  pgtype.Int4{Int32: int32(r.LatencyMs), Valid: true},
	})
	return err
}

// AddExecution enqueues an execution record for async persistence
func AddExecution(record ExecutionRecord) {
	GetStore().Enqueue(&record)
}
