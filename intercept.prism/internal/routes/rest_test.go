package routes

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/yendelevium/intercept.prism/model"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// setupRouter creates a test router using the actual exported RestRoutes
func setupRouter() *gin.Engine {
	r := gin.New()
	restRoutes(r.Group("/"))
	return r
}

func TestRestRoute_ValidRequest(t *testing.T) {
	router := setupRouter()

	// Use httptest server to mock the target
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "ok"}`))
	}))
	defer mockServer.Close()

	reqBody := model.RestRequest{
		Method:  "GET",
		URL:     mockServer.URL,
		Body:    "",
		Headers: map[string]string{"Accept": "application/json"},
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/rest/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var resp model.RestResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp.TraceID == "" {
		t.Error("Expected trace_id to be set")
	}

	if resp.SpanID == "" {
		t.Error("Expected span_id to be set")
	}

	if resp.StatusCode != 200 {
		t.Errorf("Expected status_code 200, got %d", resp.StatusCode)
	}
}

func TestRestRoute_InvalidJSON(t *testing.T) {
	router := setupRouter()

	req, _ := http.NewRequest("POST", "/rest/", bytes.NewBufferString("{invalid json"))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for invalid JSON, got %d", w.Code)
	}
}

func TestRestRoute_TargetServerError(t *testing.T) {
	router := setupRouter()

	// Mock server that returns 500
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "internal error"}`))
	}))
	defer mockServer.Close()

	reqBody := model.RestRequest{
		Method:  "GET",
		URL:     mockServer.URL,
		Body:    "",
		Headers: nil,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/rest/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should still return 200 (intercept.prism succeeded), but status_code should be 500
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var resp model.RestResponse
	json.Unmarshal(w.Body.Bytes(), &resp)

	if resp.StatusCode != 500 {
		t.Errorf("Expected status_code 500, got %d", resp.StatusCode)
	}
}

func TestRestRoute_WithBody(t *testing.T) {
	router := setupRouter()

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"id": 1}`))
	}))
	defer mockServer.Close()

	reqBody := model.RestRequest{
		Method:  "POST",
		URL:     mockServer.URL,
		Body:    `{"name": "test", "value": 123}`,
		Headers: map[string]string{"Content-Type": "application/json"},
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/rest/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var resp model.RestResponse
	json.Unmarshal(w.Body.Bytes(), &resp)

	expectedBodyLen := int64(len(reqBody.Body))
	if resp.RequestSize != expectedBodyLen {
		t.Errorf("Expected request_size %d, got %d", expectedBodyLen, resp.RequestSize)
	}
}

func TestRestRoute_TraceparentInjection(t *testing.T) {
	router := setupRouter()

	var receivedTraceparent string
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedTraceparent = r.Header.Get("traceparent")
		w.WriteHeader(http.StatusOK)
	}))
	defer mockServer.Close()

	reqBody := model.RestRequest{
		Method:  "GET",
		URL:     mockServer.URL,
		Body:    "",
		Headers: nil,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/rest/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if receivedTraceparent == "" {
		t.Error("Expected traceparent header to be injected")
	}

	// Traceparent format: 00-{traceId}-{spanId}-01
	if len(receivedTraceparent) < 55 {
		t.Errorf("Invalid traceparent format: %s", receivedTraceparent)
	}
}

func TestRestRoute_AllHTTPMethods(t *testing.T) {
	methods := []string{"GET", "POST", "PUT", "DELETE", "PATCH"}

	for _, method := range methods {
		t.Run(method, func(t *testing.T) {
			router := setupRouter()

			mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Method != method {
					t.Errorf("Expected method %s, got %s", method, r.Method)
				}
				w.WriteHeader(http.StatusOK)
			}))
			defer mockServer.Close()

			reqBody := model.RestRequest{
				Method:  method,
				URL:     mockServer.URL,
				Body:    "",
				Headers: nil,
			}

			jsonBody, _ := json.Marshal(reqBody)
			req, _ := http.NewRequest("POST", "/rest/", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("Expected status 200 for method %s, got %d", method, w.Code)
			}
		})
	}
}

func TestRestRequest_JSONSerialization(t *testing.T) {
	req := model.RestRequest{
		Method:  "POST",
		URL:     "https://api.example.com/users",
		Body:    `{"name": "John"}`,
		Headers: map[string]string{"Authorization": "Bearer token123"},
	}

	jsonBytes, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var parsed model.RestRequest
	err = json.Unmarshal(jsonBytes, &parsed)
	if err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if parsed.Method != req.Method {
		t.Errorf("Method mismatch: expected %s, got %s", req.Method, parsed.Method)
	}
	if parsed.URL != req.URL {
		t.Errorf("URL mismatch: expected %s, got %s", req.URL, parsed.URL)
	}
}

func TestRestResponse_JSONSerialization(t *testing.T) {
	resp := model.RestResponse{
		Duration:     "150ms",
		StatusCode:   201,
		Body:         `{"id": 1}`,
		Headers:      map[string]string{"Content-Type": "application/json"},
		ResponseSize: 10,
		RequestSize:  20,
		TraceID:      "abc123",
		SpanID:       "def456",
	}

	jsonBytes, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var parsed model.RestResponse
	err = json.Unmarshal(jsonBytes, &parsed)
	if err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if parsed.StatusCode != resp.StatusCode {
		t.Errorf("StatusCode mismatch: expected %d, got %d", resp.StatusCode, parsed.StatusCode)
	}
	if parsed.TraceID != resp.TraceID {
		t.Errorf("TraceID mismatch: expected %s, got %s", resp.TraceID, parsed.TraceID)
	}
}
