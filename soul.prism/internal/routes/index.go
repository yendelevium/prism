package routes

import "github.com/gin-gonic/gin"

func AddRoutes(superRouter *gin.RouterGroup) {
	restRoutes(superRouter)
}
