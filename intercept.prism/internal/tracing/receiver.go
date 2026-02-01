package tracing

import (
	"encoding/hex"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yendelevium/intercept.prism/model"
	tracev1 "go.opentelemetry.io/proto/otlp/trace/v1"
	"google.golang.org/protobuf/proto"
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

type OTLPSpan struct {
	TraceID           string         `json:"traceId"`
	SpanID            string         `json:"spanId"`
	ParentSpanID      string         `json:"parentSpanId,omitempty"`
	Name              string         `json:"name"`
	StartTimeUnixNano any            `json:"startTimeUnixNano"`
	EndTimeUnixNano   any            `json:"endTimeUnixNano"`
	Status            *OTLPStatus    `json:"status,omitempty"`
	Attributes        []OTLPKeyValue `json:"attributes,omitempty"`
}

func parseNanoTime(v any) int64 {
	switch val := v.(type) {
	case string:
		n, _ := strconv.ParseInt(val, 10, 64)
		return n
	case float64:
		return int64(val)
	case int64:
		return val
	case json.Number:
		n, _ := val.Int64()
		return n
	default:
		return 0
	}
}

func (s *OTLPSpan) GetStartTimeNano() int64 { return parseNanoTime(s.StartTimeUnixNano) }
func (s *OTLPSpan) GetEndTimeNano() int64   { return parseNanoTime(s.EndTimeUnixNano) }

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

func handleOTLPTraces(c *gin.Context) {
	contentType := c.GetHeader("Content-Type")
	contentEncoding := c.GetHeader("Content-Encoding")
	log.Printf("OTLP Request - Content-Type: %s, Encoding: %s", contentType, contentEncoding)

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	store := GetStore()
	var spanCount int

	// Detect format: protobuf or JSON
	if strings.Contains(contentType, "application/x-protobuf") || strings.Contains(contentType, "application/protobuf") {
		spanCount, err = parseProtobuf(body, store)
	} else if strings.Contains(contentType, "application/json") {
		spanCount, err = parseJSON(body, store)
	} else {
		// Try protobuf first (more common), fallback to JSON
		spanCount, err = parseProtobuf(body, store)
		if err != nil {
			spanCount, err = parseJSON(body, store)
		}
	}

	if err != nil {
		log.Printf("OTLP Parse Error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to parse OTLP data", "details": err.Error()})
		return
	}

	log.Printf("Accepted %d spans", spanCount)
	c.JSON(http.StatusOK, gin.H{"accepted": spanCount})
}

// A lot of the logic for parsing is similar, just diff datatypes. Maybe try combining them later on?
func parseProtobuf(body []byte, store *TraceStore) (int, error) {
	var req tracev1.TracesData
	if err := proto.Unmarshal(body, &req); err != nil {
		return 0, err
	}

	spanCount := 0
	for _, rs := range req.ResourceSpans {
		serviceName := "unknown"
		if rs.Resource != nil {
			for _, attr := range rs.Resource.Attributes {
				if attr.Key == "service.name" {
					serviceName = attr.Value.GetStringValue()
					break
				}
			}
		}

		for _, ss := range rs.ScopeSpans {
			for _, span := range ss.Spans {
				info := model.SpanInfo{
					SpanID:       hex.EncodeToString(span.SpanId),
					ParentSpanID: hex.EncodeToString(span.ParentSpanId),
					TraceID:      hex.EncodeToString(span.TraceId),
					Operation:    span.Name,
					ServiceName:  serviceName,
					StartTime:    int64(span.StartTimeUnixNano) / 1000,
					Duration:     int64(span.EndTimeUnixNano-span.StartTimeUnixNano) / 1000,
				}

				if span.Status != nil && span.Status.Code == tracev1.Status_STATUS_CODE_ERROR {
					info.Status = "ERROR"
				} else {
					info.Status = "OK"
				}

				if len(span.Attributes) > 0 {
					info.Tags = make(map[string]string)
					for _, attr := range span.Attributes {
						info.Tags[attr.Key] = attr.Value.GetStringValue()
					}
				}

				if store != nil {
					store.AddSpan(info)
				}
				spanCount++
			}
		}
	}
	return spanCount, nil
}

func parseJSON(body []byte, store *TraceStore) (int, error) {
	var data OTLPResourceSpans
	if err := json.Unmarshal(body, &data); err != nil {
		return 0, err
	}

	spanCount := 0
	for _, rs := range data.ResourceSpans {
		serviceName := "unknown"
		for _, attr := range rs.Resource.Attributes {
			if attr.Key == "service.name" {
				serviceName = attr.Value.StringValue
				break
			}
		}

		for _, ss := range rs.ScopeSpans {
			for _, span := range ss.Spans {
				info := model.SpanInfo{
					SpanID:       span.SpanID,
					ParentSpanID: span.ParentSpanID,
					TraceID:      span.TraceID,
					Operation:    span.Name,
					ServiceName:  serviceName,
					StartTime:    span.GetStartTimeNano() / 1000,
					Duration:     (span.GetEndTimeNano() - span.GetStartTimeNano()) / 1000,
				}

				if span.Status != nil && span.Status.Code == 2 {
					info.Status = "ERROR"
				} else {
					info.Status = "OK"
				}

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

				if store != nil {
					store.AddSpan(info)
				}
				spanCount++
			}
		}
	}
	return spanCount, nil
}
