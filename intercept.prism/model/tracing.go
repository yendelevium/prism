package model

// SpanInfo represents a single span for Gantt chart visualization
type SpanInfo struct {
	SpanID       string            `json:"span_id"`
	ParentSpanID string            `json:"parent_span_id,omitempty"`
	TraceID      string            `json:"trace_id"`
	Operation    string            `json:"operation"`
	ServiceName  string            `json:"service_name"`
	StartTime    int64             `json:"start_time"` // Unix microseconds
	Duration     int64             `json:"duration"`   // Microseconds
	Status       string            `json:"status,omitempty"`
	Tags         map[string]string `json:"tags,omitempty"`
}

// TraceResponse is the full distributed trace query result
type TraceResponse struct {
	TraceID   string     `json:"trace_id"`
	RootSpan  *SpanInfo  `json:"root_span,omitempty"`
	Spans     []SpanInfo `json:"spans"`
	Services  []string   `json:"services"` // List of services involved
	Duration  int64      `json:"duration"` // Total trace duration (microseconds)
	SpanCount int        `json:"span_count"`
}

// TraceListItem represents a trace
type TraceListItem struct {
	TraceID   string   `json:"trace_id"`
	RootName  string   `json:"root_name"`
	Services  []string `json:"services"`
	Duration  int64    `json:"duration"`
	SpanCount int      `json:"span_count"`
	StartTime int64    `json:"start_time"`
}
