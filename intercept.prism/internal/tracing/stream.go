package tracing

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yendelevium/intercept.prism/internal/store"
)

type TraceState struct {
	RootSeen     bool
	LastActivity time.Time
}

type TraceHub struct {
	subscribers map[string][]chan store.SpanRecord
	states      map[string]*TraceState
	spans       map[string][]store.SpanRecord // cache spans in-memory instead of relying on DB
	mu          sync.RWMutex
}

var Hub = &TraceHub{
	subscribers: make(map[string][]chan store.SpanRecord),
	states: make(map[string]*TraceState),
	spans: make(map[string][]store.SpanRecord),
}

func (h *TraceHub) Subscribe(traceID string) chan store.SpanRecord {
	ch := make(chan store.SpanRecord, 50)

	h.mu.Lock()
	h.subscribers[traceID] = append(h.subscribers[traceID], ch)

	// Get spans that had already arrived under this traceId from in-memory map
	existing := append([]store.SpanRecord(nil), h.spans[traceID]...)
	h.mu.Unlock()

	// asynchronously send the spans that had already arrived
	go func() {
		for _, span := range existing {
			ch <- span
		}
	}()

	return ch
}

func (h *TraceHub) Unsubscribe(traceID string, ch chan store.SpanRecord) {
	h.mu.Lock()
	defer h.mu.Unlock()

	subs := h.subscribers[traceID]
	for i, sub := range subs {
		if sub == ch {
			h.subscribers[traceID] = append(subs[:i], subs[i+1:]...)
			close(sub)
			break
		}
	}
}

func (h *TraceHub) Publish(span store.SpanRecord) {
	h.mu.Lock()

	h.spans[span.TraceID] = append(h.spans[span.TraceID], span)

	state, exists := h.states[span.TraceID]
	if !exists {
		state = &TraceState{}
		h.states[span.TraceID] = state
	}

	state.LastActivity = time.Now()
	if span.ParentSpanID == "" {
		state.RootSeen = true
	}

	subs := h.subscribers[span.TraceID]
	h.mu.Unlock()

	for _, ch := range subs {
		select {
		case ch <- span:
		default:
		}
	}
}

func StreamTrace(c *gin.Context) {
	traceID := c.Query("traceId")
	if traceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "traceId required"})
		return
	}

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		return
	}

	ctx := c.Request.Context()

	// subscribe to get new spans
	ch := Hub.Subscribe(traceID)
	defer Hub.Unsubscribe(traceID, ch)

	idleTimeout := 3 * time.Second
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case span := <-ch:
			data, _ := json.Marshal(span)
			fmt.Fprintf(c.Writer, "data: %s\n\n", data)
			flusher.Flush()

		case <-ticker.C:
			Hub.mu.RLock()
			state := Hub.states[traceID]
			Hub.mu.RUnlock()

			if state != nil &&
				state.RootSeen &&
				time.Since(state.LastActivity) > idleTimeout {

				delete(Hub.spans, traceID)
				delete(Hub.states, traceID)
				fmt.Fprintf(c.Writer, "event: complete\ndata: {}\n\n")
				flusher.Flush()
				Hub.mu.Lock()
				state.RootSeen = false // let client close connection
				Hub.mu.Unlock()
			}

		case <-ctx.Done():
			return
		}
	}
}
