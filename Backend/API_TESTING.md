# 🔐 Auth System — Backend API Testing Guide

> **Base URL:** `http://localhost/MyProjects/Backend/api/`  
> **Server:** Apache (XAMPP)  
> **Database:** MySQL (`auth_system`)  
> **Language:** PHP (PDO)

---

## 📋 Table of Contents

1. [Pre-requisites (Setup Before Testing)](#-pre-requisites)
2. [API Endpoints Overview](#-api-endpoints-overview)
3. [Health Check API](#1-health-check-api)
4. [Register API](#2-register-api)
5. [Login API](#3-login-api)
6. [Error Codes Reference](#-error-codes-reference)
7. [Testing with Postman](#-testing-with-postman)
8. [Testing with cURL (Terminal)](#-testing-with-curl)
9. [Common Errors & Fixes](#-common-errors--fixes)

---

## ✅ Pre-requisites

Before testing any API, make sure:

- [ ] **XAMPP is running** — Apache ✅ and MySQL ✅ both green
- [ ] **Database is created** — Run `database/setup.sql` in phpMyAdmin
- [ ] **DB credentials are correct** — Check `config/database.php`
- [ ] **Project path is correct** — Files are in `htdocs/MyProjects/`

---

## 📡 API Endpoints Overview

| # | Endpoint | Method | Description |
|---|---|---|---|
| 1 | `/api/health.php` | GET | Server & DB status check |
| 2 | `/api/register.php` | POST | Create new user account |
| 3 | `/api/login.php` | POST | Login with email & password |

---

## 1. Health Check API

### 📌 Endpoint
```
GET http://localhost/MyProjects/Backend/api/health.php
```

### 🎯 Purpose
Verify that Apache server is running and MySQL database is connected.

### 📤 Request
- **Method:** `GET`
- **Body:** None required
- **Headers:** None required

### ✅ Success Response
**Status Code:** `200 OK`
```json
{
  "success": true,
  "api": "Auth System API",
  "version": "1.0.0",
  "status": "running",
  "database": "connected",
  "timestamp": "2026-06-20 14:00:00"
}
```

### ❌ Database Error Response
**Status Code:** `200 OK` (API runs but DB fails)
```json
{
  "success": true,
  "api": "Auth System API",
  "version": "1.0.0",
  "status": "running",
  "database": "error: SQLSTATE[HY000] [1049] Unknown database 'auth_system'",
  "timestamp": "2026-06-20 14:00:00"
}
```

### 🔎 How to Test
- **Browser:** Open `http://localhost/MyProjects/Backend/api/health.php` directly
- **Postman:** New Request → GET → Paste URL → Send

---

## 2. Register API

### 📌 Endpoint
```
POST http://localhost/MyProjects/Backend/api/register.php
```

### 🎯 Purpose
Create a new user account. Password is stored as a **bcrypt hash**.

### 📤 Request
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Body (JSON):**

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "confirm_password": "Password123"
}
```

### 📋 Field Rules

| Field | Type | Required | Rules |
|---|---|---|---|
| `full_name` | string | ✅ Yes | Min 3, Max 100 characters |
| `email` | string | ✅ Yes | Valid email format |
| `password` | string | ✅ Yes | Min 8 chars + 1 Uppercase + 1 Number |
| `confirm_password` | string | ✅ Yes | Must match `password` |

---

### ✅ Test Case 1 — Successful Registration
**Input:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "Hello123",
  "confirm_password": "Hello123"
}
```
**Expected Response — Status:** `201 Created`
```json
{
  "success": true,
  "message": "Account created successfully! Please log in.",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### ❌ Test Case 2 — Duplicate Email
**Input:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "Hello123",
  "confirm_password": "Hello123"
}
```
**Expected Response — Status:** `409 Conflict`
```json
{
  "success": false,
  "message": "An account with this email already exists."
}
```

---

### ❌ Test Case 3 — Passwords Do Not Match
**Input:**
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Hello123",
  "confirm_password": "Hello456"
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Passwords do not match.",
  "errors": ["Passwords do not match."]
}
```

---

### ❌ Test Case 4 — Weak Password
**Input:**
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "password": "pass",
  "confirm_password": "pass"
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Password must be at least 8 characters long.",
  "errors": ["Password must be at least 8 characters long."]
}
```

---

### ❌ Test Case 5 — Missing Fields
**Input:**
```json
{
  "email": "jane@example.com"
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Full name is required. Password is required.",
  "errors": [
    "Full name is required.",
    "Password is required."
  ]
}
```

---

### ❌ Test Case 6 — Invalid Email Format
**Input:**
```json
{
  "full_name": "Test User",
  "email": "not-an-email",
  "password": "Hello123",
  "confirm_password": "Hello123"
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Please enter a valid email address.",
  "errors": ["Please enter a valid email address."]
}
```

---

## 3. Login API

### 📌 Endpoint
```
POST http://localhost/MyProjects/Backend/api/login.php
```

### 🎯 Purpose
Authenticate a user. Returns an **auth token** on success.

### 📤 Request
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Body (JSON):**

```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

### 📋 Field Rules

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | ✅ Yes | Valid email format |
| `password` | string | ✅ Yes | Cannot be empty |

---

### ✅ Test Case 1 — Successful Login
**Input:**
```json
{
  "email": "john@example.com",
  "password": "Hello123"
}
```
**Expected Response — Status:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful! Welcome back, John Doe.",
  "token": "a3f9d1c2b4e5f67890abcdef1234567890abcdef1234567890abcdef12345678",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### ❌ Test Case 2 — Wrong Password
**Input:**
```json
{
  "email": "john@example.com",
  "password": "WrongPassword"
}
```
**Expected Response — Status:** `401 Unauthorized`
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

### ❌ Test Case 3 — Email Not Registered
**Input:**
```json
{
  "email": "notregistered@example.com",
  "password": "Hello123"
}
```
**Expected Response — Status:** `401 Unauthorized`
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

### ❌ Test Case 4 — Empty Fields
**Input:**
```json
{
  "email": "",
  "password": ""
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Email address is required. Password is required.",
  "errors": [
    "Email address is required.",
    "Password is required."
  ]
}
```

---

### ❌ Test Case 5 — Wrong HTTP Method (GET instead of POST)
**Expected Response — Status:** `405 Method Not Allowed`
```json
{
  "success": false,
  "message": "Method Not Allowed. Use POST."
}
```

---

## 📊 Error Codes Reference

| HTTP Status | Meaning | When It Happens |
|---|---|---|
| `200 OK` | Request successful | Login success, Health check |
| `201 Created` | Resource created | Registration success |
| `400 Bad Request` | Invalid JSON | Malformed request body |
| `401 Unauthorized` | Auth failed | Wrong email or password |
| `405 Method Not Allowed` | Wrong HTTP method | GET on a POST-only endpoint |
| `409 Conflict` | Duplicate data | Email already registered |
| `422 Unprocessable Entity` | Validation failed | Missing/invalid fields |
| `500 Internal Server Error` | Server error | DB connection failed |

---

## 🧪 Testing with Postman

### Step-by-Step Setup:

**Step 1:** Open Postman → Click **New** → **HTTP Request**

**Step 2:** Set the method to `POST`

**Step 3:** Enter URL:
```
http://localhost/MyProjects/Backend/api/register.php
```

**Step 4:** Go to **Body** tab → Select **raw** → Choose **JSON** from dropdown

**Step 5:** Paste your JSON:
```json
{
  "full_name": "Test User",
  "email": "test@example.com",
  "password": "Test1234",
  "confirm_password": "Test1234"
}
```

**Step 6:** Click **Send** → Check response in bottom panel

### 💡 Postman Tips:
- Save requests in a **Collection** named `Auth System API`
- Use **Environments** to store `base_url = http://localhost/MyProjects/Backend/api`
- Save the `token` from login response as a variable for future requests

---

## 💻 Testing with cURL

Open **Command Prompt** or **Git Bash** and run:

### Health Check:
```bash
curl http://localhost/MyProjects/Backend/api/health.php
```

### Register:
```bash
curl -X POST http://localhost/MyProjects/Backend/api/register.php ^
  -H "Content-Type: application/json" ^
  -d "{\"full_name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"Hello123\",\"confirm_password\":\"Hello123\"}"
```

### Login:
```bash
curl -X POST http://localhost/MyProjects/Backend/api/login.php ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@example.com\",\"password\":\"Hello123\"}"
```

> **Note:** On Windows Command Prompt use `^` for line continuation and escape quotes with `\"`.  
> On Git Bash / PowerShell use single quotes around the JSON instead.

### PowerShell version:
```powershell
Invoke-RestMethod -Uri "http://localhost/MyProjects/Backend/api/register.php" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"full_name":"John Doe","email":"john@example.com","password":"Hello123","confirm_password":"Hello123"}'
```

---

## 🐛 Common Errors & Fixes

| Error | Reason | Fix |
|---|---|---|
| `ERR_CONNECTION_REFUSED` | Apache not running | Start Apache in XAMPP Control Panel |
| `database: "error: Unknown database"` | DB not created | Run `database/setup.sql` in phpMyAdmin |
| `404 Not Found` | Wrong URL path | Check file is in `htdocs/MyProjects/Backend/api/` |
| `500 Internal Server Error` | DB credentials wrong | Update `config/database.php` with correct user/pass |
| `{"success":false,"message":"Invalid JSON"}` | Bad request format | Make sure Content-Type is `application/json` |
| CORS error in browser console | CORS headers missing | Make sure `cors.php` is included in the API file |

---

## 🗺️ Quick Test Checklist

Run these in order to verify everything works:

- [ ] `GET  /api/health.php`   → `"database": "connected"`
- [ ] `POST /api/register.php` → `201` with new user data
- [ ] `POST /api/register.php` (same email again) → `409` Conflict
- [ ] `POST /api/login.php`    → `200` with token
- [ ] `POST /api/login.php`    (wrong password) → `401` Unauthorized

---

*Last Updated: 2026-06-20 | Project: MyProjects Auth System*
