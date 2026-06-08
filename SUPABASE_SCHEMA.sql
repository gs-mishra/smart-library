-- SUPABASE_SCHEMA.sql
-- Run this script inside the Supabase SQL Editor to initialize the database tables.

-- 1. Create Libraries Table
CREATE TABLE IF NOT EXISTS libraries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    admin_user TEXT NOT NULL UNIQUE,
    admin_password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Members (Students) Table
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    library_id TEXT REFERENCES libraries(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_lib_username UNIQUE (library_id, username)
);

-- 3. Create Books Table
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    library_id TEXT REFERENCES libraries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT NOT NULL,
    isbn TEXT NOT NULL,
    availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'issued')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Issue Logs Table
CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    library_id TEXT REFERENCES libraries(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    book_title TEXT NOT NULL,
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ,
    fine_paid NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'returned'))
);

-- 5. Row Level Security (RLS) Configuration
-- Because this is a frontend client application querying via the public 'anon' key,
-- you must disable RLS on the tables to allow immediate reading and writing.
-- Execute these commands in your SQL Editor:

ALTER TABLE libraries DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;

-- 6. Database Update script (If Database is Already Initialized)
-- If you already set up the tables and want to upgrade them in-place,
-- execute these lines in your SQL Editor:
-- 
-- ALTER TABLE members ADD COLUMN phone TEXT NOT NULL DEFAULT '0000000000';
-- ALTER TABLE members ADD COLUMN address TEXT;
