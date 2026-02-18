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

// setupGraphQLRouter creates a test router with GraphQL routes
func setupGraphQLRouter() *gin.Engine {
	r := gin.New()
	graphqlRoutes(r.Group("/"))
	return r
}

func TestGraphQLRoute_ValidQuery(t *testing.T) {
	router := setupGraphQLRouter()

	// Mock GraphQL server
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify it's a POST with JSON
		if r.Method != "POST" {
			t.Errorf("Expected POST method, got %s", r.Method)
		}
		if ct := r.Header.Get("Content-Type"); ct != "application/json" {
			t.Errorf("Expected Content-Type application/json, got %s", ct)
		}

		// Verify the body is a standard GraphQL request
		var gqlBody map[string]interface{}
		json.NewDecoder(r.Body).Decode(&gqlBody)
		if _, ok := gqlBody["query"]; !ok {
			t.Error("Expected 'query' field in GraphQL request body")
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data": {"user": {"id": "1", "name": "Alice"}}}`))
	}))
	defer mockServer.Close()

	reqBody := model.GraphQLRequest{
		URL:     mockServer.URL,
		Query:   `query { user(id: "1") { id name } }`,
		Headers: map[string]string{"Accept": "application/json"},
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/graphql/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var resp model.GraphQLResponse
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

	if resp.Body == "" {
		t.Error("Expected non-empty response body")
	}
}

func TestGraphQLRoute_InvalidJSON(t *testing.T) {
	router := setupGraphQLRouter()

	req, _ := http.NewRequest("POST", "/graphql/", bytes.NewBufferString("{invalid json"))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for invalid JSON, got %d", w.Code)
	}
}

func TestGraphQLRoute_TargetServerError(t *testing.T) {
	router := setupGraphQLRouter()

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"errors": [{"message": "internal error"}]}`))
	}))
	defer mockServer.Close()

	reqBody := model.GraphQLRequest{
		URL:   mockServer.URL,
		Query: `query { user { id } }`,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/graphql/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should still return 200 (intercept.prism succeeded), but status_code should be 500
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var resp model.GraphQLResponse
	json.Unmarshal(w.Body.Bytes(), &resp)

	if resp.StatusCode != 500 {
		t.Errorf("Expected status_code 500, got %d", resp.StatusCode)
	}
}

func TestGraphQLRoute_WithVariables(t *testing.T) {
	router := setupGraphQLRouter()

	var receivedBody map[string]interface{}
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewDecoder(r.Body).Decode(&receivedBody)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data": {"createUser": {"id": "2"}}}`))
	}))
	defer mockServer.Close()

	reqBody := model.GraphQLRequest{
		URL:           mockServer.URL,
		Query:         `mutation CreateUser($name: String!) { createUser(name: $name) { id } }`,
		Variables:     map[string]interface{}{"name": "Bob"},
		OperationName: "CreateUser",
		Headers:       map[string]string{"Content-Type": "application/json"},
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/graphql/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Verify variables were forwarded
	if vars, ok := receivedBody["variables"].(map[string]interface{}); !ok {
		t.Error("Expected variables to be forwarded")
	} else if vars["name"] != "Bob" {
		t.Errorf("Expected variable name=Bob, got %v", vars["name"])
	}

	// Verify operationName was forwarded
	if opName, ok := receivedBody["operationName"].(string); !ok || opName != "CreateUser" {
		t.Errorf("Expected operationName=CreateUser, got %v", receivedBody["operationName"])
	}

	var resp model.GraphQLResponse
	json.Unmarshal(w.Body.Bytes(), &resp)

	if resp.RequestSize == 0 {
		t.Error("Expected non-zero request_size")
	}
}

func TestGraphQLRoute_TraceparentInjection(t *testing.T) {
	router := setupGraphQLRouter()

	var receivedTraceparent string
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedTraceparent = r.Header.Get("traceparent")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data": null}`))
	}))
	defer mockServer.Close()

	reqBody := model.GraphQLRequest{
		URL:   mockServer.URL,
		Query: `query { __typename }`,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/graphql/", bytes.NewBuffer(jsonBody))
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

func TestGraphQLRequest_JSONSerialization(t *testing.T) {
	req := model.GraphQLRequest{
		URL:           "https://api.example.com/graphql",
		Query:         `query { users { id name } }`,
		Variables:     map[string]interface{}{"limit": float64(10)},
		OperationName: "GetUsers",
		Headers:       map[string]string{"Authorization": "Bearer token123"},
	}

	jsonBytes, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var parsed model.GraphQLRequest
	err = json.Unmarshal(jsonBytes, &parsed)
	if err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if parsed.URL != req.URL {
		t.Errorf("URL mismatch: expected %s, got %s", req.URL, parsed.URL)
	}
	if parsed.Query != req.Query {
		t.Errorf("Query mismatch: expected %s, got %s", req.Query, parsed.Query)
	}
	if parsed.OperationName != req.OperationName {
		t.Errorf("OperationName mismatch: expected %s, got %s", req.OperationName, parsed.OperationName)
	}
}

func TestGraphQLResponse_JSONSerialization(t *testing.T) {
	resp := model.GraphQLResponse{
		Duration:     "150ms",
		StatusCode:   200,
		Body:         `{"data": {"users": []}}`,
		Headers:      map[string]string{"Content-Type": "application/json"},
		ResponseSize: 22,
		RequestSize:  45,
		TraceID:      "abc123",
		SpanID:       "def456",
	}

	jsonBytes, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var parsed model.GraphQLResponse
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
	if parsed.Body != resp.Body {
		t.Errorf("Body mismatch: expected %s, got %s", resp.Body, parsed.Body)
	}
}
