package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yendelevium/intercept.prism/internal/routes"
)

func main() {
	log.Println("BYE, prism")
	// Create a Gin router with default middleware (logger and recovery)
	r := gin.Default()

	// Mounting groups on /
	apiGroup := r.Group("/")
	routes.AddRoutes(apiGroup)

	r.GET("/ping", func(c *gin.Context) {
		// Return JSON response
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})
	r.Run(":7000")
}
