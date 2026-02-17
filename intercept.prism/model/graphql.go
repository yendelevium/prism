package model

// Incoming GraphQL request from the Prism frontend
type GraphQLRequest struct {
	URL           string                 `json:"url"`
	Query         string                 `json:"query"`
	Variables     map[string]interface{} `json:"variables,omitempty"`
	OperationName string                 `json:"operation_name,omitempty"`
	Headers       map[string]string      `json:"headers"`
	RequestID     string                 `json:"request_id"`
	CollectionID  string                 `json:"collection_id"`
	CreatedByID   string                 `json:"created_by_id"`
}

// GraphQL response returned to the Prism frontend with metrics and tracing
type GraphQLResponse struct {
	Duration     string            `json:"request_duration"`
	StatusCode   int               `json:"status"`
	Body         string            `json:"body"`
	Headers      map[string]string `json:"headers"`
	Error        string            `json:"error_msg"`
	ResponseSize int64             `json:"response_size"` // in bytes
	RequestSize  int64             `json:"request_size"`  // in bytes

	// Database record IDs
	RequestID   string `json:"request_id,omitempty"`
	ExecutionID string `json:"execution_id,omitempty"`

	// Distributed tracing
	TraceID string     `json:"trace_id"`
	SpanID  string     `json:"span_id"`
	Spans   []SpanInfo `json:"spans"` // Local spans captured for this request
}
