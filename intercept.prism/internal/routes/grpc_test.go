package routes

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bufbuild/protocompile"
	"github.com/gin-gonic/gin"
	"github.com/yendelevium/intercept.prism/model"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/dynamicpb"
)

// Test proto definition
const testProto = `
syntax = "proto3";

package testpkg;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
`

// setupGRPCRouter creates a test router with gRPC routes
func setupGRPCRouter() *gin.Engine {
	r := gin.New()
	grpcRoutes(r.Group("/"))
	return r
}

// parseTestProto parses the test proto and returns the method descriptor
func parseTestProto() (protoreflect.MethodDescriptor, error) {
	compiler := protocompile.Compiler{
		Resolver: &protocompile.SourceResolver{
			Accessor: protocompile.SourceAccessorFromMap(map[string]string{
				"test.proto": testProto,
			}),
		},
	}
	compiled, err := compiler.Compile(context.Background(), "test.proto")
	if err != nil {
		return nil, err
	}
	fileDesc := compiled[0]
	services := fileDesc.Services()
	var svc protoreflect.ServiceDescriptor
	for i := 0; i < services.Len(); i++ {
		s := services.Get(i)
		if string(s.FullName()) == "testpkg.Greeter" {
			svc = s
			break
		}
	}
	if svc == nil {
		return nil, fmt.Errorf("service not found")
	}
	method := svc.Methods().ByName("SayHello")
	if method == nil {
		return nil, fmt.Errorf("method not found")
	}
	return method, nil
}

// startTestGRPCServer starts a gRPC server that handles the SayHello method
func startTestGRPCServer(t *testing.T) (string, func()) {
	t.Helper()

	methodDesc, err := parseTestProto()
	if err != nil {
		t.Fatalf("Failed to parse test proto: %v", err)
	}

	lis, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("Failed to listen: %v", err)
	}

	s := grpc.NewServer()

	// Register a generic service handler
	serviceDesc := grpc.ServiceDesc{
		ServiceName: "testpkg.Greeter",
		HandlerType: nil,
		Methods: []grpc.MethodDesc{
			{
				MethodName: "SayHello",
				Handler: func(srv any, ctx context.Context, dec func(any) error, interceptor grpc.UnaryServerInterceptor) (any, error) {
					reqMsg := dynamicpb.NewMessage(methodDesc.Input())
					if err := dec(reqMsg); err != nil {
						return nil, err
					}

					nameField := methodDesc.Input().Fields().ByName("name")
					name := reqMsg.Get(nameField).String()

					respMsg := dynamicpb.NewMessage(methodDesc.Output())
					messageField := methodDesc.Output().Fields().ByName("message")
					respMsg.Set(messageField, protoreflect.ValueOfString(fmt.Sprintf("Hello, %s!", name)))
					return respMsg, nil
				},
			},
		},
		Streams: []grpc.StreamDesc{},
	}
	s.RegisterService(&serviceDesc, nil)

	go func() {
		if err := s.Serve(lis); err != nil {
			log.Printf("Test gRPC server stopped: %v", err)
		}
	}()

	return lis.Addr().String(), func() {
		s.Stop()
		lis.Close()
	}
}

// We need context for the handler
func init() {
	// Already set in rest_test.go, but being explicit
	gin.SetMode(gin.TestMode)
}

func TestGRPCRoute_ValidRequest(t *testing.T) {
	router := setupGRPCRouter()
	addr, cleanup := startTestGRPCServer(t)
	defer cleanup()

	reqBody := model.GRPCRequest{
		ServerAddress: addr,
		Service:       "testpkg.Greeter",
		Method:        "SayHello",
		Body:          `{"name": "World"}`,
		ProtoFile:     testProto,
		Metadata:      map[string]string{},
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/grpc/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var resp model.GRPCResponse
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

	if resp.StatusCode != 0 {
		t.Errorf("Expected gRPC status 0 (OK), got %d", resp.StatusCode)
	}

	if resp.StatusName != "OK" {
		t.Errorf("Expected status_name OK, got %s", resp.StatusName)
	}

	if resp.Body == "" {
		t.Error("Expected non-empty response body")
	}

	// Verify the response contains the greeting
	var bodyMap map[string]any
	if err := json.Unmarshal([]byte(resp.Body), &bodyMap); err == nil {
		if msg, ok := bodyMap["message"].(string); !ok || msg != "Hello, World!" {
			t.Errorf("Expected 'Hello, World!' in response body, got %v", bodyMap)
		}
	}
}

func TestGRPCRoute_InvalidJSON(t *testing.T) {
	router := setupGRPCRouter()

	req, _ := http.NewRequest("POST", "/grpc/", bytes.NewBufferString("{invalid json"))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for invalid JSON, got %d", w.Code)
	}
}

func TestGRPCRoute_MissingProtoFile(t *testing.T) {
	router := setupGRPCRouter()

	reqBody := model.GRPCRequest{
		ServerAddress: "localhost:50051",
		Service:       "testpkg.Greeter",
		Method:        "SayHello",
		Body:          `{"name": "World"}`,
		ProtoFile:     "", // Missing!
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/grpc/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}

	var resp model.GRPCResponse
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Error != "proto_file content is required" {
		t.Errorf("Expected proto_file required error, got: %s", resp.Error)
	}
}

func TestGRPCRoute_InvalidProtoFile(t *testing.T) {
	router := setupGRPCRouter()

	reqBody := model.GRPCRequest{
		ServerAddress: "localhost:50051",
		Service:       "testpkg.Greeter",
		Method:        "SayHello",
		Body:          `{"name": "World"}`,
		ProtoFile:     "this is not valid proto content!!!",
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/grpc/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d. Body: %s", w.Code, w.Body.String())
	}
}

func TestGRPCRoute_InvalidServiceName(t *testing.T) {
	router := setupGRPCRouter()

	reqBody := model.GRPCRequest{
		ServerAddress: "localhost:50051",
		Service:       "nonexistent.Service",
		Method:        "SayHello",
		Body:          `{"name": "World"}`,
		ProtoFile:     testProto,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/grpc/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}

	var resp model.GRPCResponse
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Error == "" {
		t.Error("Expected error about service not found")
	}
}

func TestGRPCRoute_InvalidMethodName(t *testing.T) {
	router := setupGRPCRouter()

	reqBody := model.GRPCRequest{
		ServerAddress: "localhost:50051",
		Service:       "testpkg.Greeter",
		Method:        "NonexistentMethod",
		Body:          `{"name": "World"}`,
		ProtoFile:     testProto,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/grpc/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}

	var resp model.GRPCResponse
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Error == "" {
		t.Error("Expected error about method not found")
	}
}

func TestGRPCRoute_TraceparentInjection(t *testing.T) {
	// We need a gRPC server that captures metadata
	methodDesc, err := parseTestProto()
	if err != nil {
		t.Fatalf("Failed to parse test proto: %v", err)
	}

	var receivedTraceparent string

	lis, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("Failed to listen: %v", err)
	}

	s := grpc.NewServer()
	serviceDesc := grpc.ServiceDesc{
		ServiceName: "testpkg.Greeter",
		HandlerType: nil,
		Methods: []grpc.MethodDesc{
			{
				MethodName: "SayHello",
				Handler: func(srv any, ctx context.Context, dec func(any) error, interceptor grpc.UnaryServerInterceptor) (any, error) {
					md, ok := metadata.FromIncomingContext(ctx)
					if ok {
						vals := md.Get("traceparent")
						if len(vals) > 0 {
							receivedTraceparent = vals[0]
						}
					}

					reqMsg := dynamicpb.NewMessage(methodDesc.Input())
					if err := dec(reqMsg); err != nil {
						return nil, err
					}

					respMsg := dynamicpb.NewMessage(methodDesc.Output())
					messageField := methodDesc.Output().Fields().ByName("message")
					respMsg.Set(messageField, protoreflect.ValueOfString("Hello!"))
					return respMsg, nil
				},
			},
		},
		Streams: []grpc.StreamDesc{},
	}
	s.RegisterService(&serviceDesc, nil)

	go s.Serve(lis)
	defer func() {
		s.Stop()
		lis.Close()
	}()

	router := setupGRPCRouter()
	reqBody := model.GRPCRequest{
		ServerAddress: lis.Addr().String(),
		Service:       "testpkg.Greeter",
		Method:        "SayHello",
		Body:          `{"name": "Test"}`,
		ProtoFile:     testProto,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/grpc/", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if receivedTraceparent == "" {
		t.Error("Expected traceparent to be injected in gRPC metadata")
	}

	// Traceparent format: 00-{traceId}-{spanId}-01
	if len(receivedTraceparent) < 55 {
		t.Errorf("Invalid traceparent format: %s", receivedTraceparent)
	}
}

func TestGRPCRequest_JSONSerialization(t *testing.T) {
	req := model.GRPCRequest{
		ServerAddress: "localhost:50051",
		Service:       "testpkg.Greeter",
		Method:        "SayHello",
		Body:          `{"name": "World"}`,
		ProtoFile:     testProto,
		Metadata:      map[string]string{"authorization": "Bearer token123"},
		UseTLS:        false,
	}

	jsonBytes, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var parsed model.GRPCRequest
	err = json.Unmarshal(jsonBytes, &parsed)
	if err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if parsed.ServerAddress != req.ServerAddress {
		t.Errorf("ServerAddress mismatch: expected %s, got %s", req.ServerAddress, parsed.ServerAddress)
	}
	if parsed.Service != req.Service {
		t.Errorf("Service mismatch: expected %s, got %s", req.Service, parsed.Service)
	}
	if parsed.Method != req.Method {
		t.Errorf("Method mismatch: expected %s, got %s", req.Method, parsed.Method)
	}
	if parsed.ProtoFile != req.ProtoFile {
		t.Errorf("ProtoFile mismatch")
	}
}

func TestGRPCResponse_JSONSerialization(t *testing.T) {
	resp := model.GRPCResponse{
		Duration:         "150ms",
		StatusCode:       0,
		StatusName:       "OK",
		Body:             `{"message": "Hello, World!"}`,
		ResponseHeaders:  map[string]string{"content-type": "application/grpc"},
		ResponseTrailers: map[string]string{},
		ResponseSize:     28,
		RequestSize:      18,
		TraceID:          "abc123",
		SpanID:           "def456",
	}

	jsonBytes, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var parsed model.GRPCResponse
	err = json.Unmarshal(jsonBytes, &parsed)
	if err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if parsed.StatusCode != resp.StatusCode {
		t.Errorf("StatusCode mismatch: expected %d, got %d", resp.StatusCode, parsed.StatusCode)
	}
	if parsed.StatusName != resp.StatusName {
		t.Errorf("StatusName mismatch: expected %s, got %s", resp.StatusName, parsed.StatusName)
	}
	if parsed.TraceID != resp.TraceID {
		t.Errorf("TraceID mismatch: expected %s, got %s", resp.TraceID, parsed.TraceID)
	}
}
