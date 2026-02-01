package tracing

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yendelevium/intercept.prism/internal/database"
	"github.com/yendelevium/intercept.prism/model"
)

// TraceStore provides async database storage for spans
type TraceStore struct {
	spanQueue chan model.SpanInfo
	queries   *database.Queries
	wg        sync.WaitGroup
	done      chan struct{}
}

// NewTraceStore creates a new trace store with async DB writes
func NewTraceStore(queueSize int) *TraceStore {
	return &TraceStore{
		spanQueue: make(chan model.SpanInfo, queueSize),
		queries:   database.GetQueries(),
		done:      make(chan struct{}),
	}
}

// Start begins the background worker for async DB writes
func (ts *TraceStore) Start() {
	ts.wg.Add(1)
	go ts.worker()
}

// Stop gracefully shuts down the store
func (ts *TraceStore) Stop() {
	close(ts.done)
	ts.wg.Wait()
	close(ts.spanQueue)
}

// AddSpan queues a span for async DB write
func (ts *TraceStore) AddSpan(span model.SpanInfo) {
	select {
	case ts.spanQueue <- span:
		// Successfully queued
	default:
		// Queue full, log and drop
		log.Printf("Span queue full, dropping span: %s", span.SpanID)
	}
}

// worker processes spans from the queue and writes to DB
func (ts *TraceStore) worker() {
	defer ts.wg.Done()

	for {
		select {
		case <-ts.done:
			// Drain remaining spans before exit
			ts.drainQueue()
			return
		case span := <-ts.spanQueue:
			ts.writeSpan(span)
		}
	}
}

func (ts *TraceStore) drainQueue() {
	for {
		select {
		case span := <-ts.spanQueue:
			ts.writeSpan(span)
		default:
			return
		}
	}
}

func (ts *TraceStore) writeSpan(span model.SpanInfo) {
	// Skip if no DB connection
	if ts.queries == nil {
		log.Printf("No DB connection, dropping span: %s", span.SpanID)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Convert tags to JSON
	var tagsJSON []byte
	if span.Tags != nil {
		tagsJSON, _ = json.Marshal(span.Tags)
	}

	params := database.InsertSpanParams{
		ID:          uuid.New().String(),
		TraceId:     span.TraceID,
		SpanId:      span.SpanID,
		Operation:   span.Operation,
		ServiceName: span.ServiceName,
		StartTime:   span.StartTime,
		Duration:    span.Duration,
	}

	if span.ParentSpanID != "" {
		params.ParentSpanId = pgtype.Text{String: span.ParentSpanID, Valid: true}
	}
	if span.Status != "" {
		params.Status = pgtype.Text{String: span.Status, Valid: true}
	}
	if tagsJSON != nil {
		params.Tags = tagsJSON
	}

	if err := ts.queries.InsertSpan(ctx, params); err != nil {
		log.Printf("Failed to insert span %s: %v", span.SpanID, err)
	}
}

// Global store instance
var globalStore *TraceStore
var storeOnce sync.Once

// GetStore returns the global trace store singleton
func GetStore() *TraceStore {
	storeOnce.Do(func() {
		globalStore = NewTraceStore(1000) // Queue up to 1000 spans
		globalStore.Start()
	})
	return globalStore
}

// GenerateTraceID generates a W3C Trace Context compliant trace ID (32 hex chars)
func GenerateTraceID() string {
	return generateHexID(16)
}

// GenerateSpanID generates a span ID (16 hex chars)
func GenerateSpanID() string {
	return generateHexID(8)
}

func generateHexID(byteLen int) string {
	const hexChars = "0123456789abcdef"
	now := time.Now().UnixNano()
	result := make([]byte, byteLen*2)
	for i := 0; i < byteLen*2; i++ {
		result[i] = hexChars[(now>>uint(i*4)+int64(i))&0xf]
	}
	return string(result)
}
