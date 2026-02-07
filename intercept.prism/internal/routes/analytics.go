package routes

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yendelevium/intercept.prism/internal/database"
)

// ServiceNode represents a service in the graph
type ServiceNode struct {
	ID       string  `json:"id"`
	Label    string  `json:"label"`
	CallCount int64  `json:"callCount"`
	AvgLatency float64 `json:"avgLatency"`
	ErrorRate float64 `json:"errorRate"`
}

// ServiceEdge represents a connection between services
type ServiceEdge struct {
	Source    string `json:"source"`
	Target    string `json:"target"`
	CallCount int64  `json:"callCount"`
}

// ServiceGraphResponse is the API response
type ServiceGraphResponse struct {
	Nodes []ServiceNode `json:"nodes"`
	Edges []ServiceEdge `json:"edges"`
}

func analyticsRoutes(superRouter *gin.RouterGroup) {
	analyticsRouter := superRouter.Group("/api/traces")
	{
		analyticsRouter.GET("/service-graph", getServiceGraph)
	}
}

// getServiceGraph godoc
// @Summary      Get service dependency graph
// @Description  Returns nodes and edges representing service-to-service calls
// @Tags         Analytics
// @Produce      json
// @Success      200 {object} ServiceGraphResponse
// @Failure      500 {object} gin.H
// @Router       /api/traces/service-graph [get]
func getServiceGraph(c *gin.Context) {
	ctx := context.Background()
	
	// Get queries instance
	queries := database.GetQueries()
	if queries == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database not initialized"})
		return
	}

	// Fetch service graph data
	results, err := queries.GetServiceGraph(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service graph"})
		return
	}

	// Build nodes map to aggregate metrics per service
	nodesMap := make(map[string]*ServiceNode)
	var edges []ServiceEdge

	for _, row := range results {
		source := row.SourceService
		target := row.TargetService
		callCount := row.CallCount
		avgDuration := float64(row.AvgDuration) / 1000.0 // Convert microseconds to milliseconds
		errorCount := row.ErrorCount

		// Add/update source node
		if _, exists := nodesMap[source]; !exists {
			nodesMap[source] = &ServiceNode{
				ID:    source,
				Label: source,
			}
		}
		nodesMap[source].CallCount += callCount

		// Add/update target node
		if _, exists := nodesMap[target]; !exists {
			nodesMap[target] = &ServiceNode{
				ID:    target,
				Label: target,
			}
		}
		nodesMap[target].CallCount += callCount
		nodesMap[target].AvgLatency = avgDuration
		nodesMap[target].ErrorRate = float64(errorCount) / float64(callCount) * 100

		// Add edge
		edges = append(edges, ServiceEdge{
			Source:    source,
			Target:    target,
			CallCount: callCount,
		})
	}

	// Convert map to slice
	nodes := make([]ServiceNode, 0, len(nodesMap))
	for _, node := range nodesMap {
		nodes = append(nodes, *node)
	}

	response := ServiceGraphResponse{
		Nodes: nodes,
		Edges: edges,
	}

	c.JSON(http.StatusOK, response)
}
