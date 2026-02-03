package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

var (
	pool     *pgxpool.Pool
	poolOnce sync.Once
)

// InitDB initializes the database connection pool
func InitDB() error {
	var initErr error
	poolOnce.Do(func() {
		// Load .env file if it exists
		if err := godotenv.Load(); err != nil {
			log.Println("No .env file found, using environment variables")
		}

		connStr := os.Getenv("DATABASE_URL")
		if connStr == "" {
			initErr = fmt.Errorf("DATABASE_URL not set")
			return
		}

		var err error
		pool, err = pgxpool.New(context.Background(), connStr)
		if err != nil {
			initErr = fmt.Errorf("failed to create pool: %w", err)
			return
		}

		// Test connection
		if err := pool.Ping(context.Background()); err != nil {
			initErr = fmt.Errorf("failed to ping database: %w", err)
			return
		}

		log.Println("Database connection pool initialized")
	})
	return initErr
}

// GetPool returns the database connection pool
func GetPool() *pgxpool.Pool {
	return pool
}

// GetQueries returns a new Queries instance, or nil if DB not initialized
func GetQueries() *Queries {
	if pool == nil {
		return nil
	}
	return New(pool)
}

// Close closes the database connection pool
func Close() {
	if pool != nil {
		pool.Close()
	}
}
