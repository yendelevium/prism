package routes

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/bufbuild/protocompile"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yendelevium/intercept.prism/internal/store"
	"github.com/yendelevium/intercept.prism/internal/tracing"
	"github.com/yendelevium/intercept.prism/model"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/dynamicpb"
)

func grpcRoutes(superRouter *gin.RouterGroup) {
	grpcRouter := superRouter.Group("/grpc")
	{
		grpcRouter.POST("/", executeGRPCRequest)
	}
}

// executeGRPCRequest godoc
// @Summary      Execute a gRPC request
// @Description  Proxies a unary gRPC request to a target server using an uploaded .proto file definition
// @Tags         gRPC
// @Accept       json
// @Produce      json
// @Param        request body model.GRPCRequest true "gRPC request configuration with .proto file content"
// @Success      200 {object} model.GRPCResponse "Successful response with tracing info"
// @Failure      400 {object} model.GRPCResponse "Invalid request body or proto file"
// @Failure      500 {object} model.GRPCResponse "Request execution failed"
// @Router       /grpc/ [post]
func executeGRPCRequest(c *gin.Context) {
	// Bind the incoming request
	reqBody := model.GRPCRequest{}
	if err := c.BindJSON(&reqBody); err != nil {
		c.JSON(http.StatusBadRequest, model.GRPCResponse{
			StatusCode: http.StatusBadRequest,
			Error:      err.Error(),
		})
		return
	}
	log.Println("gRPC Request Received")

	// Validate required fields
	if reqBody.ProtoFile == "" {
		c.JSON(http.StatusBadRequest, model.GRPCResponse{
			StatusCode: http.StatusBadRequest,
			Error:      "proto_file content is required",
		})
		return
	}

	// Generate IDs upfront
	requestID := reqBody.RequestID
	executionID := uuid.New().String()
	spanID := tracing.GenerateSpanID()
	traceID := tracing.GenerateTraceID()

	// Parse the .proto file content using protocompile
	compiler := protocompile.Compiler{
		Resolver: &protocompile.SourceResolver{
			Accessor: protocompile.SourceAccessorFromMap(map[string]string{
				"uploaded.proto": reqBody.ProtoFile,
			}),
		},
	}

	compiled, err := compiler.Compile(context.Background(), "uploaded.proto")
	if err != nil {
		c.JSON(http.StatusBadRequest, model.GRPCResponse{
			StatusCode: http.StatusBadRequest,
			Error:      fmt.Sprintf("Failed to parse .proto file: %v", err),
			TraceID:    traceID,
			SpanID:     spanID,
		})
		return
	}

	if len(compiled) == 0 {
		c.JSON(http.StatusBadRequest, model.GRPCResponse{
			StatusCode: http.StatusBadRequest,
			Error:      "No file descriptors found in .proto file",
			TraceID:    traceID,
			SpanID:     spanID,
		})
		return
	}

	// Find the service descriptor
	fileDesc := compiled[0]
	var serviceDesc protoreflect.ServiceDescriptor
	services := fileDesc.Services()
	serviceName := reqBody.Service

	// Try exact match first
	for i := 0; i < services.Len(); i++ {
		svc := services.Get(i)
		if string(svc.FullName()) == serviceName || string(svc.Name()) == serviceName {
			serviceDesc = svc
			break
		}
	}

	// Try with package prefix if not found
	if serviceDesc == nil {
		pkg := string(fileDesc.Package())
		if pkg != "" {
			qualifiedName := pkg + "." + serviceName
			for i := 0; i < services.Len(); i++ {
				svc := services.Get(i)
				if string(svc.FullName()) == qualifiedName {
					serviceDesc = svc
					break
				}
			}
		}
	}

	if serviceDesc == nil {
		c.JSON(http.StatusBadRequest, model.GRPCResponse{
			StatusCode: http.StatusBadRequest,
			Error:      fmt.Sprintf("Service '%s' not found in .proto file", reqBody.Service),
			TraceID:    traceID,
			SpanID:     spanID,
		})
		return
	}

	// Find the method descriptor
	methodDesc := serviceDesc.Methods().ByName(protoreflect.Name(reqBody.Method))
	if methodDesc == nil {
		c.JSON(http.StatusBadRequest, model.GRPCResponse{
			StatusCode: http.StatusBadRequest,
			Error:      fmt.Sprintf("Method '%s' not found in service '%s'", reqBody.Method, reqBody.Service),
			TraceID:    traceID,
			SpanID:     spanID,
		})
		return
	}

	// Build the request message from JSON using dynamicpb
	reqMsg := dynamicpb.NewMessage(methodDesc.Input())
	if reqBody.Body != "" {
		if err := protojson.Unmarshal([]byte(reqBody.Body), reqMsg); err != nil {
			c.JSON(http.StatusBadRequest, model.GRPCResponse{
				StatusCode: http.StatusBadRequest,
				Error:      fmt.Sprintf("Failed to unmarshal request body JSON: %v", err),
				TraceID:    traceID,
				SpanID:     spanID,
			})
			return
		}
	}

	// Dial the target gRPC server
	dialOpts := []grpc.DialOption{}
	if !reqBody.UseTLS {
		dialOpts = append(dialOpts, grpc.WithTransportCredentials(insecure.NewCredentials()))
	}

	conn, err := grpc.NewClient(reqBody.ServerAddress, dialOpts...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.GRPCResponse{
			StatusCode: http.StatusInternalServerError,
			Error:      fmt.Sprintf("Failed to connect to gRPC server: %v", err),
			TraceID:    traceID,
			SpanID:     spanID,
		})
		return
	}
	defer conn.Close()

	// Build outgoing metadata
	md := metadata.New(nil)
	for key, value := range reqBody.Metadata {
		md.Set(key, value)
	}
	// Inject W3C traceparent
	traceparent := fmt.Sprintf("00-%s-%s-01", traceID, spanID)
	md.Set("traceparent", traceparent)

	ctx := metadata.NewOutgoingContext(context.Background(), md)
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// Invoke the RPC using conn.Invoke with dynamicpb messages
	respMsg := dynamicpb.NewMessage(methodDesc.Output())
	fullMethod := fmt.Sprintf("/%s/%s", serviceDesc.FullName(), methodDesc.Name())
	var respHeaders, respTrailers metadata.MD

	requestStart := time.Now()
	err = conn.Invoke(ctx, fullMethod, reqMsg, respMsg,
		grpc.Header(&respHeaders),
		grpc.Trailer(&respTrailers),
	)
	responseEnd := time.Now()
	totalDuration := responseEnd.Sub(requestStart)

	// Flatten metadata
	flatHeaders := flattenMetadata(respHeaders)
	flatTrailers := flattenMetadata(respTrailers)

	// Handle RPC error
	if err != nil {
		st, _ := status.FromError(err)

		grpcStatus := "ERROR"
		tags := map[string]string{
			"grpc.service":     reqBody.Service,
			"grpc.method":      reqBody.Method,
			"grpc.status_code": fmt.Sprintf("%d", int(st.Code())),
			"grpc.status_name": st.Code().String(),
		}

		// Queue records for async DB write
		store.AddExecution(store.ExecutionRecord{
			ID:         executionID,
			RequestID:  requestID,
			TraceID:    traceID,
			StatusCode: int(st.Code()),
			LatencyMs:  int(totalDuration.Milliseconds()),
		})

		store.AddSpan(store.SpanRecord{
			ID:          uuid.New().String(),
			TraceID:     traceID,
			SpanID:      spanID,
			Operation:   fmt.Sprintf("gRPC %s/%s", reqBody.Service, reqBody.Method),
			ServiceName: "intercept.prism",
			StartTime:   requestStart.UnixMicro(),
			Duration:    totalDuration.Microseconds(),
			Status:      grpcStatus,
			Tags:        tags,
		})

		rootSpan := model.SpanInfo{
			SpanID:      spanID,
			TraceID:     traceID,
			Operation:   fmt.Sprintf("gRPC %s/%s", reqBody.Service, reqBody.Method),
			ServiceName: "intercept.prism",
			StartTime:   requestStart.UnixMicro(),
			Duration:    totalDuration.Microseconds(),
			Status:      grpcStatus,
			Tags:        tags,
		}

		c.JSON(http.StatusOK, model.GRPCResponse{
			Duration:         fmt.Sprintf("%vms", totalDuration.Milliseconds()),
			StatusCode:       int(st.Code()),
			StatusName:       st.Code().String(),
			Body:             "",
			ResponseHeaders:  flatHeaders,
			ResponseTrailers: flatTrailers,
			Error:            st.Message(),
			RequestSize:      int64(len(reqBody.Body)),
			RequestID:        requestID,
			ExecutionID:      executionID,
			TraceID:          traceID,
			SpanID:           spanID,
			Spans:            []model.SpanInfo{rootSpan},
		})
		return
	}

	// Marshal response to JSON using protojson
	respJSON, err := protojson.Marshal(respMsg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.GRPCResponse{
			StatusCode: http.StatusInternalServerError,
			Error:      fmt.Sprintf("Failed to marshal response to JSON: %v", err),
			TraceID:    traceID,
			SpanID:     spanID,
		})
		return
	}

	// Determine status
	grpcStatus := "OK"
	tags := map[string]string{
		"grpc.service":     reqBody.Service,
		"grpc.method":      reqBody.Method,
		"grpc.status_code": "0",
		"grpc.status_name": "OK",
	}

	// Queue records for async DB write
	store.AddExecution(store.ExecutionRecord{
		ID:         executionID,
		RequestID:  requestID,
		TraceID:    traceID,
		StatusCode: 0, // gRPC OK
		LatencyMs:  int(totalDuration.Milliseconds()),
	})

	store.AddSpan(store.SpanRecord{
		ID:          uuid.New().String(),
		TraceID:     traceID,
		SpanID:      spanID,
		Operation:   fmt.Sprintf("gRPC %s/%s", reqBody.Service, reqBody.Method),
		ServiceName: "intercept.prism",
		StartTime:   requestStart.UnixMicro(),
		Duration:    totalDuration.Microseconds(),
		Status:      grpcStatus,
		Tags:        tags,
	})

	log.Println("Queued Execution, and Span for async DB write (gRPC)")

	rootSpan := model.SpanInfo{
		SpanID:      spanID,
		TraceID:     traceID,
		Operation:   fmt.Sprintf("gRPC %s/%s", reqBody.Service, reqBody.Method),
		ServiceName: "intercept.prism",
		StartTime:   requestStart.UnixMicro(),
		Duration:    totalDuration.Microseconds(),
		Status:      grpcStatus,
		Tags:        tags,
	}

	finalResponse := model.GRPCResponse{
		Duration:         fmt.Sprintf("%vms", totalDuration.Milliseconds()),
		StatusCode:       0,
		StatusName:       "OK",
		Body:             string(respJSON),
		ResponseHeaders:  flatHeaders,
		ResponseTrailers: flatTrailers,
		Error:            "",
		ResponseSize:     int64(len(respJSON)),
		RequestSize:      int64(len(reqBody.Body)),
		RequestID:        requestID,
		ExecutionID:      executionID,
		TraceID:          traceID,
		SpanID:           spanID,
		Spans:            []model.SpanInfo{rootSpan},
	}
	c.JSON(http.StatusOK, finalResponse)
}

// flattenMetadata converts gRPC metadata to a flat map
func flattenMetadata(md metadata.MD) map[string]string {
	flat := make(map[string]string)
	for k, v := range md {
		flat[k] = strings.Join(v, ", ")
	}
	return flat
}
