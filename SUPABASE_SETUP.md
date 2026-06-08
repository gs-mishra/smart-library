# Step-by-Step Supabase Backend Integration Guide

Follow these steps to connect your Smart Library portal to your live **Supabase PostgreSQL** cloud database:

---

## Step 1: Initialize Your Supabase Database Schema
1. Log in to the [Supabase Console](https://supabase.com/dashboard).
2. Open your project dashboard (e.g., `smart-library`).
3. Click on **SQL Editor** in the left sidebar menu (represented by the `SQL` terminal icon).
4. Click **New Query** to open a fresh script editor tab.
5. Open the project file **[SUPABASE_SCHEMA.sql](file:///e:/Smart%20Library/SUPABASE_SCHEMA.sql)** in your editor.
6. Copy the entire DDL contents (which create the `libraries`, `members`, `books`, and `issues` tables).
7. Paste the DDL queries into the Supabase SQL Editor window and click **Run** (or press `Ctrl+Enter`).
8. You should see a success message: *"Success. No rows returned."*.
9. Click **Table Editor** in the left sidebar (grid icon) to verify that the following 4 tables exist:
   - `libraries`
   - `members`
   - `books`
   - `issues`

---

## Step 2: Configure Web App Client (Already Completed!)
Your codebase has already been pre-configured with the connection parameters inside **[supabase-config.js](file:///e:/Smart%20Library/js/supabase-config.js)**:
- **Project URL**: `https://ufnkdbmqctdkyjozevzw.supabase.co`
- **Anon Public API Key**: `sb_publishable_0ImDwpkpqqeRhJcLwnN-aw_eYMLW5jm`

If you ever need to change your database project:
1. Navigate to your Supabase Project Settings page (gear icon at the bottom-left).
2. Click **API** under the Project Settings list.
3. Copy the **Project URL** and the public `anon` `public` key.
4. Replace the values inside `js/supabase-config.js` with your new keys.

---

## Step 3: Run the Portal & Audit Data Sync
1. Open **[index.html](file:///e:/Smart%20Library/index.html)** in any browser.
2. Select **Settings** in the Admin Dashboard sidebar.
3. Verify the status displays a green **`[Supabase Active]`** badge.
4. Add new books, checkouts, and student profiles in the UI.
5. Check your Supabase **Table Editor** dashboard. You will see all data columns populated and synchronized in real-time in the Postgres database!
