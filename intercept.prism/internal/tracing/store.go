package tracing

import (
	"sync"
	"time"

	"github.com/yendelevium/intercept.prism/model"
)

// TraceStore provides thread-safe in-memory storage for spans
type TraceStore struct {
	mu     sync.RWMutex
	spans  map[string][]model.SpanInfo // traceID -> spans
	traces []string                    // ordered list of trace IDs (most recent first)
	maxLen int                         // max traces to keep
}

// NewTraceStore creates a new trace store with the given capacity
func NewTraceStore(maxTraces int) *TraceStore {
	return &TraceStore{
		spans:  make(map[string][]model.SpanInfo),
		traces: make([]string, 0, maxTraces),
		maxLen: maxTraces,
	}
}

// AddSpan stores a span, creating the trace entry if needed
func (ts *TraceStore) AddSpan(span model.SpanInfo) {
	ts.mu.Lock()
	defer ts.mu.Unlock()

	traceID := span.TraceID
	if _, exists := ts.spans[traceID]; !exists {
		// New trace - add to front of list
		ts.traces = append([]string{traceID}, ts.traces...)
		// Evict oldest if over capacity
		if len(ts.traces) > ts.maxLen {
			oldestID := ts.traces[len(ts.traces)-1]
			delete(ts.spans, oldestID)
			ts.traces = ts.traces[:len(ts.traces)-1]
		}
	}
	ts.spans[traceID] = append(ts.spans[traceID], span)
}

// AddSpans stores multiple spans for a trace
func (ts *TraceStore) AddSpans(spans []model.SpanInfo) {
	for _, span := range spans {
		ts.AddSpan(span)
	}
}

// GetTrace returns all spans for a given trace ID
func (ts *TraceStore) GetTrace(traceID string) (*model.TraceResponse, bool) {
	ts.mu.RLock()
	defer ts.mu.RUnlock()

	spans, exists := ts.spans[traceID]
	if !exists || len(spans) == 0 {
		return nil, false
	}

	// Build response
	resp := &model.TraceResponse{
		TraceID:   traceID,
		Spans:     spans,
		SpanCount: len(spans),
	}

	// Find root span and gather services
	serviceSet := make(map[string]struct{})
	var minStart, maxEnd int64 = 1<<63 - 1, 0

	for i := range spans {
		span := &spans[i]
		serviceSet[span.ServiceName] = struct{}{}

		// Track timing for total duration
		if span.StartTime < minStart {
			minStart = span.StartTime
		}
		endTime := span.StartTime + span.Duration
		if endTime > maxEnd {
			maxEnd = endTime
		}

		// Find root span (no parent)
		if span.ParentSpanID == "" {
			resp.RootSpan = span
		}
	}

	resp.Duration = maxEnd - minStart
	for svc := range serviceSet {
		resp.Services = append(resp.Services, svc)
	}

	return resp, true
}

// ListTraces returns recent traces for the list view
func (ts *TraceStore) ListTraces(limit int) []model.TraceListItem {
	ts.mu.RLock()
	defer ts.mu.RUnlock()

	if limit > len(ts.traces) {
		limit = len(ts.traces)
	}

	result := make([]model.TraceListItem, 0, limit)
	for i := 0; i < limit; i++ {
		traceID := ts.traces[i]
		spans := ts.spans[traceID]
		if len(spans) == 0 {
			continue
		}

		item := model.TraceListItem{
			TraceID:   traceID,
			SpanCount: len(spans),
		}

		// Gather services and find root
		serviceSet := make(map[string]struct{})
		var minStart, maxEnd int64 = 1<<63 - 1, 0

		for _, span := range spans {
			serviceSet[span.ServiceName] = struct{}{}
			if span.StartTime < minStart {
				minStart = span.StartTime
			}
			if endTime := span.StartTime + span.Duration; endTime > maxEnd {
				maxEnd = endTime
			}
			if span.ParentSpanID == "" {
				item.RootName = span.Operation
			}
		}

		item.StartTime = minStart
		item.Duration = maxEnd - minStart
		for svc := range serviceSet {
			item.Services = append(item.Services, svc)
		}

		result = append(result, item)
	}

	return result
}

// Global store instance
var globalStore *TraceStore
var storeOnce sync.Once

// GetStore returns the global trace store singleton
func GetStore() *TraceStore {
	storeOnce.Do(func() {
		globalStore = NewTraceStore(1000) // Keep last 1000 traces
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
		// Mix timestamp with position for uniqueness
		result[i] = hexChars[(now>>uint(i*4)+int64(i))&0xf]
	}
	return string(result)
}
