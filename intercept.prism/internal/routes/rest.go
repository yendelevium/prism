package routes

import (
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httptrace"
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

			// Timing variables for httptrace
			var (
				dnsStart, dnsDone         time.Time
				connectStart, connectDone time.Time
				tlsStart, tlsDone         time.Time
				gotFirstByte              time.Time
				requestStart              time.Time
			)

			// Create httptrace to capture detailed timing
			trace := &httptrace.ClientTrace{
				DNSStart: func(_ httptrace.DNSStartInfo) {
					dnsStart = time.Now()
				},
				DNSDone: func(_ httptrace.DNSDoneInfo) {
					dnsDone = time.Now()
				},
				ConnectStart: func(_, _ string) {
					connectStart = time.Now()
				},
				ConnectDone: func(_, _ string, _ error) {
					connectDone = time.Now()
				},
				TLSHandshakeStart: func() {
					tlsStart = time.Now()
				},
				TLSHandshakeDone: func(_ tls.ConnectionState, _ error) {
					tlsDone = time.Now()
				},
				GotFirstResponseByte: func() {
					gotFirstByte = time.Now()
				},
			}

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

			// Add httptrace context
			remoteReq = remoteReq.WithContext(httptrace.WithClientTrace(remoteReq.Context(), trace))

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
			requestStart = time.Now()
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

			// Calculate timing breakdown
			timing := model.HTTPTimingInfo{}
			if !dnsDone.IsZero() && !dnsStart.IsZero() {
				timing.DNSLookup = dnsDone.Sub(dnsStart).Microseconds()
			}
			if !connectDone.IsZero() && !connectStart.IsZero() {
				timing.TCPConnect = connectDone.Sub(connectStart).Microseconds()
			}
			if !tlsDone.IsZero() && !tlsStart.IsZero() {
				timing.TLSHandshake = tlsDone.Sub(tlsStart).Microseconds()
			}
			if !gotFirstByte.IsZero() {
				// Server processing = time from connection done to first byte
				baseTime := connectDone
				if !tlsDone.IsZero() {
					baseTime = tlsDone
				}
				if !baseTime.IsZero() {
					timing.ServerProcessing = gotFirstByte.Sub(baseTime).Microseconds()
				}
			}
			if !gotFirstByte.IsZero() {
				timing.ContentTransfer = responseEnd.Sub(gotFirstByte).Microseconds()
			}

			totalDuration := responseEnd.Sub(requestStart)

			// Flatten Headers
			respHeaders := make(map[string]string)
			for k, v := range remoteResponse.Header {
				respHeaders[k] = strings.Join(v, ", ")
			}

			// Build local spans for this request
			localSpans := []model.SpanInfo{}
			baseStartTime := requestStart.UnixMicro()

			// Root span (the HTTP request)
			rootSpan := model.SpanInfo{
				SpanID:      spanID,
				TraceID:     traceID,
				Operation:   fmt.Sprintf("%s %s", reqBody.Method, reqBody.URL),
				ServiceName: "intercept.prism",
				StartTime:   baseStartTime,
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
			localSpans = append(localSpans, rootSpan)

			// Child spans for timing phases
			currentOffset := int64(0)

			if timing.DNSLookup > 0 {
				localSpans = append(localSpans, model.SpanInfo{
					SpanID:       tracing.GenerateSpanID(),
					ParentSpanID: spanID,
					TraceID:      traceID,
					Operation:    "DNS Lookup",
					ServiceName:  "intercept.prism",
					StartTime:    baseStartTime + currentOffset,
					Duration:     timing.DNSLookup,
				})
				currentOffset += timing.DNSLookup
			}

			if timing.TCPConnect > 0 {
				localSpans = append(localSpans, model.SpanInfo{
					SpanID:       tracing.GenerateSpanID(),
					ParentSpanID: spanID,
					TraceID:      traceID,
					Operation:    "TCP Connect",
					ServiceName:  "intercept.prism",
					StartTime:    baseStartTime + currentOffset,
					Duration:     timing.TCPConnect,
				})
				currentOffset += timing.TCPConnect
			}

			if timing.TLSHandshake > 0 {
				localSpans = append(localSpans, model.SpanInfo{
					SpanID:       tracing.GenerateSpanID(),
					ParentSpanID: spanID,
					TraceID:      traceID,
					Operation:    "TLS Handshake",
					ServiceName:  "intercept.prism",
					StartTime:    baseStartTime + currentOffset,
					Duration:     timing.TLSHandshake,
				})
				currentOffset += timing.TLSHandshake
			}

			if timing.ServerProcessing > 0 {
				localSpans = append(localSpans, model.SpanInfo{
					SpanID:       tracing.GenerateSpanID(),
					ParentSpanID: spanID,
					TraceID:      traceID,
					Operation:    "Server Processing",
					ServiceName:  "intercept.prism",
					StartTime:    baseStartTime + currentOffset,
					Duration:     timing.ServerProcessing,
				})
				currentOffset += timing.ServerProcessing
			}

			if timing.ContentTransfer > 0 {
				localSpans = append(localSpans, model.SpanInfo{
					SpanID:       tracing.GenerateSpanID(),
					ParentSpanID: spanID,
					TraceID:      traceID,
					Operation:    "Content Transfer",
					ServiceName:  "intercept.prism",
					StartTime:    baseStartTime + currentOffset,
					Duration:     timing.ContentTransfer,
				})
			}

			// Store spans
			store.AddSpans(localSpans)

			// Construct and Send Final Response
			finalResponse := model.RestResponse{
				Duration:     fmt.Sprintf("%vms", totalDuration.Milliseconds()),
				StatusCode:   remoteResponse.StatusCode,
				Body:         string(responseBodyBytes),
				Headers:      respHeaders,
				Error:        "",
				ResponseSize: int64(len(responseBodyBytes)),
				RequestSize:  int64(len(reqBody.Body)),
				Timing:       timing,
				TraceID:      traceID,
				SpanID:       spanID,
				Spans:        localSpans,
			}
			c.JSON(http.StatusOK, finalResponse)
		})
	}
}
