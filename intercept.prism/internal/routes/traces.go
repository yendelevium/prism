package routes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yendelevium/intercept.prism/internal/tracing"
)

// Once I change the store to DB this will go to soul.prism
func tracesRoutes(superRouter *gin.RouterGroup) {
	tracesRouter := superRouter.Group("/traces")
	{
		// List recent traces
		tracesRouter.GET("/", func(c *gin.Context) {
			limitStr := c.DefaultQuery("limit", "50")
			limit, err := strconv.Atoi(limitStr)
			if err != nil || limit <= 0 {
				limit = 50
			}
			if limit > 100 {
				limit = 100
			}

			store := tracing.GetStore()
			traces := store.ListTraces(limit)
			c.JSON(http.StatusOK, gin.H{
				"traces": traces,
				"count":  len(traces),
			})
		})

		// Get full trace by ID
		tracesRouter.GET("/:traceId", func(c *gin.Context) {
			traceID := c.Param("traceId")
			if traceID == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "trace ID required"})
				return
			}

			store := tracing.GetStore()
			trace, found := store.GetTrace(traceID)
			if !found {
				c.JSON(http.StatusNotFound, gin.H{"error": "trace not found"})
				return
			}

			c.JSON(http.StatusOK, trace)
		})
	}
}
