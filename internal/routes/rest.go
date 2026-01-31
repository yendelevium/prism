package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func restRoutes(superRouter *gin.RouterGroup) {
	restRouter := superRouter.Group("/rest")
	{
		restRouter.POST("/", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status_code": "200",
				"headers":     "[header list]",
				"time_taken":  "xxx ms",
				"body":        "{dummy:data}",
			})
		})
	}
}
