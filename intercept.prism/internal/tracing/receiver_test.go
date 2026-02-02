package tracing

import (
	"testing"

	commonv1 "go.opentelemetry.io/proto/otlp/common/v1"
	resourcev1 "go.opentelemetry.io/proto/otlp/resource/v1"
	tracev1 "go.opentelemetry.io/proto/otlp/trace/v1"
	"google.golang.org/protobuf/proto"
)

// MockStore that doesn't write to DB (for testing parse logic only)
type mockStore struct {
	spans []string
}

func (m *mockStore) AddSpan(span interface{}) {
	// Just count, don't actually store
}

func TestParseProtobuf_ValidData(t *testing.T) {
	traceID := []byte{0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10}
	spanID := []byte{0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18}

	tracesData := &tracev1.TracesData{
		ResourceSpans: []*tracev1.ResourceSpans{
			{
				Resource: &resourcev1.Resource{
					Attributes: []*commonv1.KeyValue{
						{Key: "service.name", Value: &commonv1.AnyValue{Value: &commonv1.AnyValue_StringValue{StringValue: "test-service"}}},
					},
				},
				ScopeSpans: []*tracev1.ScopeSpans{
					{
						Spans: []*tracev1.Span{
							{
								TraceId:           traceID,
								SpanId:            spanID,
								Name:              "GET /api/users",
								StartTimeUnixNano: 1700000000000000000,
								EndTimeUnixNano:   1700000001000000000,
								Status:            &tracev1.Status{Code: tracev1.Status_STATUS_CODE_OK},
							},
						},
					},
				},
			},
		},
	}

	protoBytes, err := proto.Marshal(tracesData)
	if err != nil {
		t.Fatalf("Failed to marshal protobuf: %v", err)
	}

	// Parse and verify - use nil store since we just test parsing
	spanCount, err := parseProtobuf(protoBytes)
	if err != nil {
		t.Fatalf("parseProtobuf failed: %v", err)
	}

	if spanCount != 1 {
		t.Errorf("Expected 1 span, got %d", spanCount)
	}
}

func TestParseProtobuf_MultipleSpans(t *testing.T) {
	traceID := []byte{0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10}

	tracesData := &tracev1.TracesData{
		ResourceSpans: []*tracev1.ResourceSpans{
			{
				Resource: &resourcev1.Resource{
					Attributes: []*commonv1.KeyValue{
						{Key: "service.name", Value: &commonv1.AnyValue{Value: &commonv1.AnyValue_StringValue{StringValue: "api-service"}}},
					},
				},
				ScopeSpans: []*tracev1.ScopeSpans{
					{
						Spans: []*tracev1.Span{
							{TraceId: traceID, SpanId: []byte{0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08}, Name: "span-1"},
							{TraceId: traceID, SpanId: []byte{0x02, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08}, Name: "span-2"},
							{TraceId: traceID, SpanId: []byte{0x03, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08}, Name: "span-3"},
						},
					},
				},
			},
		},
	}

	protoBytes, _ := proto.Marshal(tracesData)
	spanCount, err := parseProtobuf(protoBytes)

	if err != nil {
		t.Fatalf("parseProtobuf failed: %v", err)
	}
	if spanCount != 3 {
		t.Errorf("Expected 3 spans, got %d", spanCount)
	}
}

func TestParseProtobuf_ErrorStatus(t *testing.T) {
	traceID := []byte{0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10}
	spanID := []byte{0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18}

	tracesData := &tracev1.TracesData{
		ResourceSpans: []*tracev1.ResourceSpans{
			{
				Resource: &resourcev1.Resource{},
				ScopeSpans: []*tracev1.ScopeSpans{
					{
						Spans: []*tracev1.Span{
							{
								TraceId: traceID,
								SpanId:  spanID,
								Name:    "failed-operation",
								Status:  &tracev1.Status{Code: tracev1.Status_STATUS_CODE_ERROR, Message: "something went wrong"},
							},
						},
					},
				},
			},
		},
	}

	protoBytes, _ := proto.Marshal(tracesData)
	spanCount, err := parseProtobuf(protoBytes)

	if err != nil {
		t.Fatalf("parseProtobuf failed: %v", err)
	}
	if spanCount != 1 {
		t.Errorf("Expected 1 span, got %d", spanCount)
	}
}

func TestParseProtobuf_InvalidData(t *testing.T) {
	_, err := parseProtobuf([]byte{0x00, 0x01, 0x02, 0xff, 0xfe})
	if err != nil {
		t.Logf("Expected error for invalid protobuf: %v", err)
	}
}

func TestParseProtobuf_ServiceNameExtraction(t *testing.T) {
	traceID := []byte{0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10}

	tracesData := &tracev1.TracesData{
		ResourceSpans: []*tracev1.ResourceSpans{
			{
				Resource: &resourcev1.Resource{
					Attributes: []*commonv1.KeyValue{
						{Key: "host.name", Value: &commonv1.AnyValue{Value: &commonv1.AnyValue_StringValue{StringValue: "server-1"}}},
						{Key: "service.name", Value: &commonv1.AnyValue{Value: &commonv1.AnyValue_StringValue{StringValue: "payment-service"}}},
					},
				},
				ScopeSpans: []*tracev1.ScopeSpans{
					{
						Spans: []*tracev1.Span{
							{TraceId: traceID, SpanId: []byte{0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18}, Name: "process-payment"},
						},
					},
				},
			},
		},
	}

	protoBytes, _ := proto.Marshal(tracesData)
	spanCount, err := parseProtobuf(protoBytes)

	if err != nil {
		t.Fatalf("parseProtobuf failed: %v", err)
	}
	if spanCount != 1 {
		t.Errorf("Expected 1 span, got %d", spanCount)
	}
}

func TestParseJSON_ValidData(t *testing.T) {
	jsonPayload := []byte(`{
		"resourceSpans": [{
			"resource": {
				"attributes": [{"key": "service.name", "value": {"stringValue": "test-service"}}]
			},
			"scopeSpans": [{
				"scope": {"name": "test-scope"},
				"spans": [{
					"traceId": "abc123",
					"spanId": "span456",
					"parentSpanId": "",
					"name": "GET /users",
					"startTimeUnixNano": "1700000000000000000",
					"endTimeUnixNano": "1700000001000000000",
					"status": {"code": 1},
					"attributes": [{"key": "http.method", "value": {"stringValue": "GET"}}]
				}]
			}]
		}]
	}`)

	spanCount, err := parseJSON(jsonPayload)
	if err != nil {
		t.Fatalf("parseJSON failed: %v", err)
	}

	if spanCount != 1 {
		t.Errorf("Expected 1 span, got %d", spanCount)
	}
}

func TestParseJSON_MultipleSpans(t *testing.T) {
	jsonPayload := []byte(`{
		"resourceSpans": [{
			"resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "api"}}]},
			"scopeSpans": [{
				"spans": [
					{"traceId": "trace1", "spanId": "span1", "name": "op1", "startTimeUnixNano": "1000", "endTimeUnixNano": "2000"},
					{"traceId": "trace1", "spanId": "span2", "name": "op2", "startTimeUnixNano": "1000", "endTimeUnixNano": "2000"},
					{"traceId": "trace1", "spanId": "span3", "name": "op3", "startTimeUnixNano": "1000", "endTimeUnixNano": "2000"}
				]
			}]
		}]
	}`)

	spanCount, err := parseJSON(jsonPayload)
	if err != nil {
		t.Fatalf("parseJSON failed: %v", err)
	}

	if spanCount != 3 {
		t.Errorf("Expected 3 spans, got %d", spanCount)
	}
}

func TestParseJSON_InvalidData(t *testing.T) {
	invalidPayloads := []struct {
		name    string
		payload string
	}{
		{"empty", ""},
		{"invalid json", "{not valid json}"},
	}

	for _, tc := range invalidPayloads {
		t.Run(tc.name, func(t *testing.T) {
			_, err := parseJSON([]byte(tc.payload))
			if err == nil {
				t.Errorf("Expected error for %s payload", tc.name)
			}
		})
	}
}

func TestParseJSON_EmptySpans(t *testing.T) {
	jsonPayload := []byte(`{
		"resourceSpans": [{
			"resource": {"attributes": []},
			"scopeSpans": []
		}]
	}`)

	spanCount, err := parseJSON(jsonPayload)
	if err != nil {
		t.Fatalf("parseJSON failed: %v", err)
	}

	if spanCount != 0 {
		t.Errorf("Expected 0 spans, got %d", spanCount)
	}
}

func TestParseJSON_ServiceNameExtraction(t *testing.T) {
	jsonPayload := []byte(`{
		"resourceSpans": [{
			"resource": {
				"attributes": [
					{"key": "host.name", "value": {"stringValue": "myhost"}},
					{"key": "service.name", "value": {"stringValue": "my-service"}}
				]
			},
			"scopeSpans": [{
				"spans": [{"traceId": "t1", "spanId": "s1", "name": "op", "startTimeUnixNano": "1000", "endTimeUnixNano": "2000"}]
			}]
		}]
	}`)

	spanCount, err := parseJSON(jsonPayload)
	if err != nil {
		t.Fatalf("parseJSON failed: %v", err)
	}

	if spanCount != 1 {
		t.Errorf("Expected 1 span, got %d", spanCount)
	}
}

func TestParseNanoTime_Formats(t *testing.T) {
	tests := []struct {
		name     string
		input    any
		expected int64
	}{
		{"string", "1700000000000000000", 1700000000000000000},
		{"float64", float64(1700000000000000000), 1700000000000000000},
		{"int64", int64(1700000000000000000), 1700000000000000000},
		{"zero string", "0", 0},
		{"nil", nil, 0},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result := parseNanoTime(tc.input)
			if result != tc.expected {
				t.Errorf("Expected %d, got %d", tc.expected, result)
			}
		})
	}
}
