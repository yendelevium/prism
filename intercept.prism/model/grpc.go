package model

// Incoming gRPC request from the Prism frontend
type GRPCRequest struct {
	ServerAddress string            `json:"server_address"`
	Service       string            `json:"service"`
	Method        string            `json:"method"`
	Body          string            `json:"body"`
	ProtoFile     string            `json:"proto_file"`
	Metadata      map[string]string `json:"metadata"`
	UseTLS        bool              `json:"use_tls"`
	RequestID     string            `json:"request_id"`
	CollectionID  string            `json:"collection_id"`
	CreatedByID   string            `json:"created_by_id"`
}

// gRPC response returned to the Prism frontend with metrics and tracing
type GRPCResponse struct {
	Duration         string            `json:"request_duration"`
	StatusCode       int               `json:"status_code"`
	StatusName       string            `json:"status_name"`
	Body             string            `json:"body"`
	ResponseHeaders  map[string]string `json:"response_headers"`
	ResponseTrailers map[string]string `json:"response_trailers"`
	Error            string            `json:"error_msg"`
	ResponseSize     int64             `json:"response_size"` // in bytes
	RequestSize      int64             `json:"request_size"`  // in bytes

	// Database record IDs
	RequestID   string `json:"request_id,omitempty"`
	ExecutionID string `json:"execution_id,omitempty"`

	// Distributed tracing
	TraceID string     `json:"trace_id"`
	SpanID  string     `json:"span_id"`
	Spans   []SpanInfo `json:"spans"` // Local spans captured for this request
}
