package tracing

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yendelevium/intercept.prism/model"
)

// This files is basically a parser for OTEL data from thr standard OTEL format
type OTLPStatus struct {
	Code    int    `json:"code"`
	Message string `json:"message,omitempty"`
}

type OTLPValue struct {
	StringValue string `json:"stringValue,omitempty"`
	IntValue    string `json:"intValue,omitempty"`
	BoolValue   bool   `json:"boolValue,omitempty"`
}

type OTLPKeyValue struct {
	Key   string    `json:"key"`
	Value OTLPValue `json:"value"`
}

// OTLPSpan represents a span in OTLP JSON format (Protobuf is more efficient but ok)
type OTLPSpan struct {
	TraceID           string         `json:"traceId"`
	SpanID            string         `json:"spanId"`
	ParentSpanID      string         `json:"parentSpanId,omitempty"`
	Name              string         `json:"name"`
	StartTimeUnixNano json.Number    `json:"startTimeUnixNano"`
	EndTimeUnixNano   json.Number    `json:"endTimeUnixNano"`
	Status            *OTLPStatus    `json:"status,omitempty"`
	Attributes        []OTLPKeyValue `json:"attributes,omitempty"`
}

func (s *OTLPSpan) GetStartTimeNano() int64 {
	v, _ := strconv.ParseInt(string(s.StartTimeUnixNano), 10, 64)
	return v
}

func (s *OTLPSpan) GetEndTimeNano() int64 {
	v, _ := strconv.ParseInt(string(s.EndTimeUnixNano), 10, 64)
	return v
}

// OTLPResourceSpans represents the top-level OTLP trace export format
type OTLPResourceSpans struct {
	ResourceSpans []struct {
		Resource struct {
			Attributes []OTLPKeyValue `json:"attributes"`
		} `json:"resource"`
		ScopeSpans []struct {
			Scope struct {
				Name string `json:"name"`
			} `json:"scope"`
			Spans []OTLPSpan `json:"spans"`
		} `json:"scopeSpans"`
	} `json:"resourceSpans"`
}

// The OTLP HTTP endpoint where the upstream will send the data to
// This is the standard endpoint to make it compatible with any OpenTelemetry SDK
// PPL need to put `export OTEL_EXPORTER_OTLP_ENDPOINT=http://intercept.prism:7000` in their config though...
func RegisterOTLPReceiver(router *gin.RouterGroup) {
	router.POST("/v1/traces", handleOTLPTraces)
}

// Parse the recieved trace data and store it in the global store
// The store is a drop in replacement for the DB as I haven't decided DB schema yet...
// Will replace store with a DB soon
func handleOTLPTraces(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	var data OTLPResourceSpans
	if err := json.Unmarshal(body, &data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid OTLP JSON format", "details": err.Error()})
		return
	}

	store := GetStore()
	spanCount := 0

	for _, rs := range data.ResourceSpans {
		// Extract service name from resource attributes
		serviceName := "unknown"
		for _, attr := range rs.Resource.Attributes {
			if attr.Key == "service.name" {
				serviceName = attr.Value.StringValue
				break
			}
		}

		for _, ss := range rs.ScopeSpans {
			for _, span := range ss.Spans {
				startNano := span.GetStartTimeNano()
				endNano := span.GetEndTimeNano()

				// Convert OTLP span to our model
				info := model.SpanInfo{
					SpanID:       span.SpanID,
					ParentSpanID: span.ParentSpanID,
					TraceID:      span.TraceID,
					Operation:    span.Name,
					ServiceName:  serviceName,
					StartTime:    startNano / 1000, // nano to micro
					Duration:     (endNano - startNano) / 1000,
				}

				// Extract status
				if span.Status != nil {
					if span.Status.Code == 2 { // ERROR
						info.Status = "ERROR"
					} else {
						info.Status = "OK"
					}
				}

				// Extract attributes as tags
				if len(span.Attributes) > 0 {
					info.Tags = make(map[string]string)
					for _, attr := range span.Attributes {
						if attr.Value.StringValue != "" {
							info.Tags[attr.Key] = attr.Value.StringValue
						} else if attr.Value.IntValue != "" {
							info.Tags[attr.Key] = attr.Value.IntValue
						}
					}
				}

				store.AddSpan(info)
				spanCount++
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"accepted": spanCount})
}
