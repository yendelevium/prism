package model

// TODO: make the struct more detailed... like cookie details and stuff
// This is for a basic request, content-type must be added in headers
type RestRequest struct {
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Body    string            `json:"body"`
	Headers map[string]string `json:"headers"`
}

type RestResponse struct {
	Duration   string            `json:"request_duration"`
	StatusCode int               `json:"status"`
	Body       string            `json:"body"`
	Headers    map[string]string `json:"headers"`
	Error      string            `json:"error_msg"`
}
