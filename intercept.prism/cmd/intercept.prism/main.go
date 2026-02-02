package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	_ "github.com/yendelevium/intercept.prism/docs" // Swagger docs
	"github.com/yendelevium/intercept.prism/internal/database"
	"github.com/yendelevium/intercept.prism/internal/routes"
)

// @title           Intercept Prism API
// @version         1.0
// @description     API testing and distributed tracing platform
// @host            localhost:7000
// @BasePath        /
func main() {
	log.Println("Starting intercept.prism")
	database.InitDB()

	// Create a Gin router with default middleware (logger and recovery)
	r := gin.Default()

	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

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
