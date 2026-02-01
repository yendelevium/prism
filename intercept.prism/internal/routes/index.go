package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/yendelevium/intercept.prism/internal/tracing"
)

func AddRoutes(superRouter *gin.RouterGroup) {
	restRoutes(superRouter)
	tracing.RegisterOTLPReceiver(superRouter)
}
