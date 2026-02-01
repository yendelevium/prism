package routes

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yendelevium/intercept.prism/internal/tracing"
	"github.com/yendelevium/intercept.prism/model"
)

func restRoutes(superRouter *gin.RouterGroup) {
	restRouter := superRouter.Group("/rest")
	{
		restRouter.POST("/", func(c *gin.Context) {
			// Get the request details
			reqBody := model.RestRequest{}
			if err := c.BindJSON(&reqBody); err != nil {
				response := model.RestResponse{
					StatusCode: http.StatusBadRequest,
					Error:      err.Error(),
				}
				c.JSON(http.StatusBadRequest, response)
				return
			}
			log.Println("Request Received")

			// Generate trace context
			traceID := tracing.GenerateTraceID()
			spanID := tracing.GenerateSpanID()
			store := tracing.GetStore()

			// Construct the request
			remoteBody := strings.NewReader(reqBody.Body)
			remoteReq, err := http.NewRequest(reqBody.Method, reqBody.URL, remoteBody)
			if err != nil {
				response := model.RestResponse{
					StatusCode: http.StatusInternalServerError,
					Error:      err.Error(),
				}
				c.JSON(http.StatusInternalServerError, response)
				return
			}

			// Add the headers
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
				response := model.RestResponse{
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
				c.JSON(http.StatusInternalServerError, model.RestResponse{
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

			// Record the Root Span
			rootSpan := model.SpanInfo{
				SpanID:      spanID,
				TraceID:     traceID,
				Operation:   fmt.Sprintf("%s %s", reqBody.Method, reqBody.URL),
				ServiceName: "intercept.prism",
				StartTime:   requestStart.UnixMicro(),
				Duration:    totalDuration.Microseconds(),
				Status:      "OK",
				Tags: map[string]string{
					"http.method":      reqBody.Method,
					"http.url":         reqBody.URL,
					"http.status_code": fmt.Sprintf("%d", remoteResponse.StatusCode),
				},
			}

			if remoteResponse.StatusCode >= 400 {
				rootSpan.Status = "ERROR"
			}

			// Store the single span
			store.AddSpan(rootSpan)

			// Construct and Send Final Response
			finalResponse := model.RestResponse{
				Duration:     fmt.Sprintf("%vms", totalDuration.Milliseconds()),
				StatusCode:   remoteResponse.StatusCode,
				Body:         string(responseBodyBytes),
				Headers:      respHeaders,
				Error:        "",
				ResponseSize: int64(len(responseBodyBytes)),
				RequestSize:  int64(len(reqBody.Body)),
				TraceID:      traceID,
				SpanID:       spanID,
				Spans:        []model.SpanInfo{rootSpan},
			}
			c.JSON(http.StatusOK, finalResponse)
		})
	}
}
