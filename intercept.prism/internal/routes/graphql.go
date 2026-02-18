package routes

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yendelevium/intercept.prism/internal/store"
	"github.com/yendelevium/intercept.prism/internal/tracing"
	"github.com/yendelevium/intercept.prism/model"
)

func graphqlRoutes(superRouter *gin.RouterGroup) {
	graphqlRouter := superRouter.Group("/graphql")
	{
		graphqlRouter.POST("/", executeGraphQLRequest)
	}
}

// graphqlRequestBody is the standard GraphQL POST body sent to the target server
type graphqlRequestBody struct {
	Query         string         `json:"query"`
	Variables     map[string]any `json:"variables,omitempty"`
	OperationName string         `json:"operationName,omitempty"`
}

// executeGraphQLRequest godoc
// @Summary      Execute a GraphQL request
// @Description  Proxies a GraphQL request to a target endpoint with tracing enabled
// @Tags         GraphQL
// @Accept       json
// @Produce      json
// @Param        request body model.GraphQLRequest true "GraphQL request configuration"
// @Success      200 {object} model.GraphQLResponse "Successful response with tracing info"
// @Failure      400 {object} model.GraphQLResponse "Invalid request body"
// @Failure      500 {object} model.GraphQLResponse "Request execution failed"
// @Router       /graphql/ [post]
func executeGraphQLRequest(c *gin.Context) {
	// Bind the incoming request
	reqBody := model.GraphQLRequest{}
	if err := c.BindJSON(&reqBody); err != nil {
		response := model.GraphQLResponse{
			StatusCode: http.StatusBadRequest,
			Error:      err.Error(),
		}
		c.JSON(http.StatusBadRequest, response)
		return
	}
	log.Println("GraphQL Request Received")

	// Get the request ID from the body
	requestID := reqBody.RequestID

	// Generate IDs upfront
	executionID := uuid.New().String()
	spanID := tracing.GenerateSpanID()
	traceID := tracing.GenerateTraceID()

	// Build standard GraphQL POST body
	gqlBody := graphqlRequestBody{
		Query:         reqBody.Query,
		Variables:     reqBody.Variables,
		OperationName: reqBody.OperationName,
	}
	gqlBodyBytes, err := json.Marshal(gqlBody)
	if err != nil {
		response := model.GraphQLResponse{
			StatusCode: http.StatusInternalServerError,
			Error:      "Failed to marshal GraphQL request body",
		}
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Construct the HTTP request
	remoteReq, err := http.NewRequest("POST", reqBody.URL, strings.NewReader(string(gqlBodyBytes)))
	if err != nil {
		response := model.GraphQLResponse{
			StatusCode: http.StatusInternalServerError,
			Error:      err.Error(),
		}
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Set Content-Type for GraphQL
	remoteReq.Header.Set("Content-Type", "application/json")

	// Add custom headers (may override Content-Type if user intends to)
	for key, value := range reqBody.Headers {
		remoteReq.Header.Set(key, value)
	}

	// Inject W3C Trace Context headers for distributed tracing
	traceparent := fmt.Sprintf("00-%s-%s-01", traceID, spanID)
	remoteReq.Header.Set("traceparent", traceparent)

	// Make the request
	reqClient := http.Client{
		Timeout: 30 * time.Second,
	}
	requestStart := time.Now()
	remoteResponse, err := reqClient.Do(remoteReq)
	if err != nil {
		response := model.GraphQLResponse{
			StatusCode: http.StatusInternalServerError,
			Error:      err.Error(),
			TraceID:    traceID,
			SpanID:     spanID,
		}
		c.JSON(http.StatusInternalServerError, response)
		return
	}
	defer remoteResponse.Body.Close()

	// Read response body
	responseBodyBytes, err := io.ReadAll(remoteResponse.Body)
	responseEnd := time.Now()
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.GraphQLResponse{
			StatusCode: http.StatusInternalServerError,
			Error:      "Failed to read response body",
			TraceID:    traceID,
			SpanID:     spanID,
		})
		return
	}

	totalDuration := responseEnd.Sub(requestStart)

	// Flatten Headers
	respHeaders := make(map[string]string)
	for k, v := range remoteResponse.Header {
		respHeaders[k] = strings.Join(v, ", ")
	}

	// Determine status
	status := "OK"
	if remoteResponse.StatusCode >= 400 {
		status = "ERROR"
	}

	// Build tags for the span
	tags := map[string]string{
		"graphql.operation": reqBody.OperationName,
		"graphql.url":       reqBody.URL,
		"http.status_code":  fmt.Sprintf("%d", remoteResponse.StatusCode),
	}

	// Queue records for async DB write
	store.AddExecution(store.ExecutionRecord{
		ID:         executionID,
		RequestID:  requestID,
		TraceID:    traceID,
		StatusCode: remoteResponse.StatusCode,
		LatencyMs:  int(totalDuration.Milliseconds()),
	})

	store.AddSpan(store.SpanRecord{
		ID:          uuid.New().String(),
		TraceID:     traceID,
		SpanID:      spanID,
		Operation:   fmt.Sprintf("GraphQL %s", reqBody.URL),
		ServiceName: "intercept.prism",
		StartTime:   requestStart.UnixMicro(),
		Duration:    totalDuration.Microseconds(),
		Status:      status,
		Tags:        tags,
	})

	log.Println("Queued Execution, and Span for async DB write (GraphQL)")

	// Build span info for response (for client-side display)
	rootSpan := model.SpanInfo{
		SpanID:      spanID,
		TraceID:     traceID,
		Operation:   fmt.Sprintf("GraphQL %s", reqBody.URL),
		ServiceName: "intercept.prism",
		StartTime:   requestStart.UnixMicro(),
		Duration:    totalDuration.Microseconds(),
		Status:      status,
		Tags:        tags,
	}

	// Construct and Send Final Response
	finalResponse := model.GraphQLResponse{
		Duration:     fmt.Sprintf("%vms", totalDuration.Milliseconds()),
		StatusCode:   remoteResponse.StatusCode,
		Body:         string(responseBodyBytes),
		Headers:      respHeaders,
		Error:        "",
		ResponseSize: int64(len(responseBodyBytes)),
		RequestSize:  int64(len(gqlBodyBytes)),
		RequestID:    requestID,
		ExecutionID:  executionID,
		TraceID:      traceID,
		SpanID:       spanID,
		Spans:        []model.SpanInfo{rootSpan},
	}
	c.JSON(http.StatusOK, finalResponse)
}
