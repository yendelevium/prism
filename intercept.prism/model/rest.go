package model

// A single span for Gantt chart visualization
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

// Detailed HTTP request timing phases
type HTTPTimingInfo struct {
	DNSLookup        int64 `json:"dns_lookup_us"`
	TCPConnect       int64 `json:"tcp_connect_us"`
	TLSHandshake     int64 `json:"tls_handshake_us"`
	ServerProcessing int64 `json:"server_processing_us"` // Time to first byte
	ContentTransfer  int64 `json:"content_transfer_us"`  // Time to download body
}

// Incoming API test request
type RestRequest struct {
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Body    string            `json:"body"`
	Headers map[string]string `json:"headers"`
}

// API test response with metrics and tracing
type RestResponse struct {
	Duration     string            `json:"request_duration"`
	StatusCode   int               `json:"status"`
	Body         string            `json:"body"`
	Headers      map[string]string `json:"headers"`
	Error        string            `json:"error_msg"`
	ResponseSize int64             `json:"response_size"` // in bytes
	RequestSize  int64             `json:"request_size"`  // in bytes
	Timing       HTTPTimingInfo    `json:"timing"`

	// Distributed tracing
	TraceID string     `json:"trace_id"`
	SpanID  string     `json:"span_id"`
	Spans   []SpanInfo `json:"spans"` // Local spans captured for this request
}

// Full distributed trace query result
type TraceResponse struct {
	TraceID   string     `json:"trace_id"`
	RootSpan  *SpanInfo  `json:"root_span,omitempty"`
	Spans     []SpanInfo `json:"spans"`
	Services  []string   `json:"services"` // List of services involved
	Duration  int64      `json:"duration"` // Total trace duration (microseconds)
	SpanCount int        `json:"span_count"`
}

// Trace in the list view
type TraceListItem struct {
	TraceID   string   `json:"trace_id"`
	RootName  string   `json:"root_name"`
	Services  []string `json:"services"`
	Duration  int64    `json:"duration"`
	SpanCount int      `json:"span_count"`
	StartTime int64    `json:"start_time"`
}
