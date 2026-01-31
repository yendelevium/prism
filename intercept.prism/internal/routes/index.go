package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/yendelevium/intercept.prism/internal/tracing"
)

func AddRoutes(superRouter *gin.RouterGroup) {
	RestRoutes(superRouter)
	TracesRoutes(superRouter)
	tracing.RegisterOTLPReceiver(superRouter)
}
