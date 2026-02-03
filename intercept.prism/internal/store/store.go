package store

import (
	"log"
	"sync"
)

// Record is the interface that all storable records must implement
type Record interface {
	// Write persists the record to the database
	Write() error
	// Type returns a string identifier for logging
	Type() string
	// GetID returns the unique identifier for the record
	GetID() string
}

// Store provides a unified async queue for all database writes
type Store struct {
	queue chan Record
	wg    sync.WaitGroup
	done  chan struct{}
}

// NewStore creates a new store with the specified queue size
func NewStore(queueSize int) *Store {
	return &Store{
		queue: make(chan Record, queueSize),
		done:  make(chan struct{}),
	}
}

// Start begins the background worker for async DB writes
func (s *Store) Start() {
	s.wg.Add(1)
	go s.worker()
}

// Stop gracefully shuts down the store, draining remaining records
func (s *Store) Stop() {
	close(s.done)
	s.wg.Wait()
	close(s.queue)
}

// Enqueue adds a record to the queue for async persistence
func (s *Store) Enqueue(record Record) {
	select {
	case s.queue <- record:
		// Successfully queued
	default:
		// Queue full, log and drop
		log.Printf("Store queue full, dropping %s: %s", record.Type(), record.GetID())
	}
}

// worker processes records from the queue
func (s *Store) worker() {
	defer s.wg.Done()

	for {
		select {
		case <-s.done:
			s.drainQueue()
			return
		case record := <-s.queue:
			s.write(record)
		}
	}
}

func (s *Store) drainQueue() {
	for {
		select {
		case record := <-s.queue:
			s.write(record)
		default:
			return
		}
	}
}

func (s *Store) write(record Record) {
	if err := record.Write(); err != nil {
		log.Printf("Failed to write %s %s: %v", record.Type(), record.GetID(), err)
	} else {
		log.Printf("Saved %s: %s", record.Type(), record.GetID())
	}
}

// Global store instance
var globalStore *Store
var storeOnce sync.Once

// GetStore returns the global store singleton
func GetStore() *Store {
	storeOnce.Do(func() {
		globalStore = NewStore(1000) // Queue up to 1000 records
		globalStore.Start()
	})
	return globalStore
}
