package routes

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yendelevium/intercept.prism/model"
)

func restRoutes(superRouter *gin.RouterGroup) {
	restRouter := superRouter.Group("/rest")
	{
		restRouter.POST("/", func(c *gin.Context) {
			// Get the request details
			reqBody := model.RestRequest{}
			if err := c.BindJSON(&reqBody); err != nil {
				response := model.RestResponse{
					StatusCode: http.StatusBadRequest,
					Error:      err.Error(),
				}
				c.JSON(http.StatusBadRequest, response)
				return
			} else {
				log.Println("Request Recieved")
			}

			// Construct the request
			remoteBody := strings.NewReader(reqBody.Body)
			remoteReq, err := http.NewRequest(reqBody.Method, reqBody.URL, remoteBody)
			if err != nil {
				response := model.RestResponse{
					StatusCode: http.StatusInternalServerError,
					Error:      err.Error(),
				}
				c.JSON(http.StatusInternalServerError, response)
				return
			}

			// Add the headers
			for key, value := range reqBody.Headers {
				remoteReq.Header.Set(key, value)
			}

			// Make the request
			reqClient := http.Client{
				Timeout: 10 * time.Second,
			}
			startRequest := time.Now()
			remoteResponse, err := reqClient.Do(remoteReq)
			if err != nil {
				response := model.RestResponse{
					StatusCode: http.StatusInternalServerError,
					Error:      err.Error(),
				}
				c.JSON(http.StatusInternalServerError, response)
				return
			}
			timeElapsed := time.Since(startRequest).Milliseconds()
			defer remoteResponse.Body.Close()

			// Build the response
			responseBodyBytes, err := io.ReadAll(remoteResponse.Body)
			if err != nil {
				c.JSON(http.StatusInternalServerError, model.RestResponse{
					StatusCode: http.StatusInternalServerError,
					Error:      "Failed to read response body",
				})
				return
			}

			// Flatten Headers (map[string][]string -> map[string]string)
			respHeaders := make(map[string]string)
			for k, v := range remoteResponse.Header {
				respHeaders[k] = strings.Join(v, ", ")
			}

			// Construct and Send Final Response
			finalResponse := model.RestResponse{
				Duration:   fmt.Sprintf("%vms", timeElapsed),
				StatusCode: remoteResponse.StatusCode,
				Body:       string(responseBodyBytes),
				Headers:    respHeaders,
				Error:      "",
			}
			c.JSON(http.StatusOK, finalResponse)
		})
	}
}
