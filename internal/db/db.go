package db

import (
	"database/sql"
	"fmt"
	"log"
	"strings"

	_ "github.com/lib/pq"
	_ "modernc.org/sqlite"
)

type DB struct {
	*sql.DB
	Driver string
}

func InitDB(driver, dbSource string) (*DB, error) {
	// Map 'sqlite3' to 'sqlite' for modernc.org/sqlite
	sqlDriver := driver
	if sqlDriver == "sqlite3" || sqlDriver == "sqlite" {
		sqlDriver = "sqlite"
		if !strings.Contains(dbSource, "_pragma") {
			if strings.Contains(dbSource, "?") {
				dbSource += "&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)"
			} else {
				dbSource += "?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)"
			}
		}
	}

	db, err := sql.Open(sqlDriver, dbSource)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	dbWrapper := &DB{DB: db, Driver: sqlDriver}

	if err := dbWrapper.createTables(); err != nil {
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	if err := dbWrapper.seedInitialData(); err != nil {
		log.Printf("Warning: failed to seed initial data: %v", err)
	}

	return dbWrapper, nil
}

func (d *DB) createTables() error {
	var schema string
	if d.Driver == "postgres" {
		schema = `
		CREATE EXTENSION IF NOT EXISTS pg_trgm;

		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			role VARCHAR(50) NOT NULL,
			team_id INT DEFAULT 1,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS tasks (
			id SERIAL PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			description TEXT DEFAULT '',
			status VARCHAR(50) NOT NULL DEFAULT 'todo',
			priority VARCHAR(50) NOT NULL DEFAULT 'medium',
			assignee_id INT REFERENCES users(id) ON DELETE SET NULL,
			reporter_id INT REFERENCES users(id) ON DELETE SET NULL,
			parent_task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS attachments (
			id SERIAL PRIMARY KEY,
			task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
			uploader_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			file_url TEXT NOT NULL,
			file_type VARCHAR(100) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS comments (
			id SERIAL PRIMARY KEY,
			task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
			user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS notifications (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			actor_id INT REFERENCES users(id) ON DELETE SET NULL,
			message TEXT NOT NULL,
			reference_url TEXT,
			is_read BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm ON tasks USING gin (title gin_trgm_ops);
		`
	} else {
		// SQLite compatible schema
		schema = `
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT UNIQUE NOT NULL,
			role TEXT NOT NULL,
			team_id INTEGER DEFAULT 1,
			teams_webhook_url TEXT DEFAULT '',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS tasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT DEFAULT '',
			status TEXT NOT NULL DEFAULT 'todo',
			priority TEXT NOT NULL DEFAULT 'medium',
			assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
			reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
			parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS attachments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
			uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			file_url TEXT NOT NULL,
			file_type TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS comments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS notifications (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
			message TEXT NOT NULL,
			reference_url TEXT,
			is_read INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		`
	}

	_, err := d.Exec(schema)
	if err != nil {
		return err
	}

	// Auto-migrate: ensure teams_webhook_url column exists on existing DB instances
	_, _ = d.Exec("ALTER TABLE users ADD COLUMN teams_webhook_url TEXT DEFAULT ''")
	return nil
}

func (d *DB) seedInitialData() error {
	var count int
	err := d.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil
	}

	seedUsers := []struct {
		Email  string
		Role   string
		TeamID int
	}{
		{"admin@smartops.io", "admin", 1},
		{"manager@smartops.io", "manager", 1},
		{"dev@smartops.io", "employee", 1},
	}

	for _, u := range seedUsers {
		_, err := d.Exec("INSERT INTO users (email, role, team_id) VALUES (?, ?, ?)", u.Email, u.Role, u.TeamID)
		if err != nil {
			// Try PostgreSQL $ parameters if positional fails
			_, err = d.Exec("INSERT INTO users (email, role, team_id) VALUES ($1, $2, $3)", u.Email, u.Role, u.TeamID)
			if err != nil {
				return err
			}
		}
	}

	log.Println("Database seeded with default users: admin@smartops.io (admin), manager@smartops.io (manager), dev@smartops.io (employee)")
	return nil
}
