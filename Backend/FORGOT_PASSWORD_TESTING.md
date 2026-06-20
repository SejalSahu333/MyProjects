# 🔑 Forgot Password Feature — API Testing Guide

> **Base URL:** `http://localhost/MyProjects/Backend/api/`  
> **Feature:** Forgot Password via OTP (Resend.com)  
> **APIs Covered:** `forgot-password.php` | `verify-otp.php` | `reset-password.php`

---

## 📋 Table of Contents

1. [Pre-requisites](#-pre-requisites)
2. [API Endpoints Overview](#-api-endpoints-overview)
3. [Forgot Password API](#1-forgot-password-api)
4. [Verify OTP API](#2-verify-otp-api)
5. [Reset Password API](#3-reset-password-api)
6. [Full Flow Test (End-to-End)](#-full-flow-test-end-to-end)
7. [Error Codes Reference](#-error-codes-reference)
8. [Testing with Postman](#-testing-with-postman)
9. [Testing with cURL](#-testing-with-curl)
10. [Common Errors & Fixes](#-common-errors--fixes)

---

## ✅ Pre-requisites

Before testing, confirm all these are ready:

- [ ] XAMPP running — Apache ✅ MySQL ✅
- [ ] `auth_system` database exists in phpMyAdmin
- [ ] `password_resets` table created (run `add_password_resets.sql`)
- [ ] `config/resend.php` has your **Resend API Key**
- [ ] At least one user registered (email exists in `users` table)
- [ ] Health check passing → `http://localhost/MyProjects/Backend/api/health.php`

---

## 📡 API Endpoints Overview

| # | Endpoint | Method | Purpose |
|---|---|---|---|
| 1 | `/api/forgot-password.php` | POST | Send OTP to user's email |
| 2 | `/api/verify-otp.php` | POST | Validate OTP → Get reset token |
| 3 | `/api/reset-password.php` | POST | Set new password using reset token |

### Flow Order:
```
forgot-password.php  →  verify-otp.php  →  reset-password.php
       (Step 1)              (Step 2)             (Step 3)
```

---

## 1. Forgot Password API

### 📌 Endpoint
```
POST http://localhost/MyProjects/Backend/api/forgot-password.php
```

### 🎯 Purpose
Accept user's email → Generate 6-digit OTP → Send OTP via Resend.com email

### 📤 Request
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "email": "john@example.com"
}
```

---

### ✅ Test Case 1 — Registered Email (Success)
**Input:**
```json
{
  "email": "john@example.com"
}
```
**Expected Response — Status:** `200 OK`
```json
{
  "success": true,
  "message": "If this email is registered, an OTP has been sent."
}
```
> ✅ Check your inbox — OTP email should arrive within seconds.

---

### ✅ Test Case 2 — Unregistered Email (Same Message — Security Feature)
**Input:**
```json
{
  "email": "notregistered@example.com"
}
```
**Expected Response — Status:** `200 OK`
```json
{
  "success": true,
  "message": "If this email is registered, an OTP has been sent."
}
```
> ✅ Same response as registered email — this prevents **email enumeration attacks**.  
> No OTP is sent for unregistered emails.

---

### ❌ Test Case 3 — Invalid Email Format
**Input:**
```json
{
  "email": "not-an-email"
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Please enter a valid email address."
}
```

---

### ❌ Test Case 4 — Empty Email
**Input:**
```json
{
  "email": ""
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Email address is required."
}
```

---

### ❌ Test Case 5 — Wrong HTTP Method
```
GET http://localhost/MyProjects/Backend/api/forgot-password.php
```
**Expected Response — Status:** `405 Method Not Allowed`
```json
{
  "success": false,
  "message": "Method Not Allowed. Use POST."
}
```

---

## 2. Verify OTP API

### 📌 Endpoint
```
POST http://localhost/MyProjects/Backend/api/verify-otp.php
```

### 🎯 Purpose
Validate the 6-digit OTP entered by user. If valid → returns a `reset_token` used in Step 3.

### 📤 Request
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "email": "john@example.com",
  "otp": "483920"
}
```

> 💡 Get the real OTP from the email you received in Test Case 1 above.

---

### ✅ Test Case 1 — Correct OTP (Success)
**Input:**
```json
{
  "email": "john@example.com",
  "otp": "483920"
}
```
**Expected Response — Status:** `200 OK`
```json
{
  "success": true,
  "message": "OTP verified successfully.",
  "reset_token": "a3f9d1c2b4e5f67890abcdef1234567890abcdef1234567890abcdef12345678"
}
```
> ⚠️ **Save the `reset_token`** — you will need it in Step 3 (Reset Password).

---

### ❌ Test Case 2 — Wrong OTP
**Input:**
```json
{
  "email": "john@example.com",
  "otp": "000000"
}
```
**Expected Response — Status:** `400 Bad Request`
```json
{
  "success": false,
  "message": "Invalid OTP."
}
```

---

### ❌ Test Case 3 — Expired OTP (wait 10+ minutes then test)
**Input:**
```json
{
  "email": "john@example.com",
  "otp": "483920"
}
```
**Expected Response — Status:** `400 Bad Request`
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new one."
}
```

---

### ❌ Test Case 4 — Already Used OTP (use same OTP twice)
**Input:** (Same correct OTP used a second time)
```json
{
  "email": "john@example.com",
  "otp": "483920"
}
```
**Expected Response — Status:** `400 Bad Request`
```json
{
  "success": false,
  "message": "OTP has already been used."
}
```

---

### ❌ Test Case 5 — Missing OTP Field
**Input:**
```json
{
  "email": "john@example.com"
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "OTP is required."
}
```

---

### ❌ Test Case 6 — OTP Wrong Length (not 6 digits)
**Input:**
```json
{
  "email": "john@example.com",
  "otp": "123"
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "OTP must be exactly 6 digits."
}
```

---

## 3. Reset Password API

### 📌 Endpoint
```
POST http://localhost/MyProjects/Backend/api/reset-password.php
```

### 🎯 Purpose
Use the `reset_token` from Step 2 to set a new password for the user.

### 📤 Request
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "reset_token": "a3f9d1c2b4e5f67890abcdef1234567890abcdef1234567890abcdef12345678",
  "password": "NewPass123",
  "confirm_password": "NewPass123"
}
```

---

### ✅ Test Case 1 — Successful Password Reset
**Input:**
```json
{
  "reset_token": "a3f9d1c2b4e5...64chars",
  "password": "NewPass123",
  "confirm_password": "NewPass123"
}
```
**Expected Response — Status:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successfully! Please log in."
}
```
> ✅ Now go to `login.html` and login with **`NewPass123`** — it should work!  
> ✅ Old password should **no longer work**.

---

### ❌ Test Case 2 — Invalid/Fake Reset Token
**Input:**
```json
{
  "reset_token": "thisisafaketoken1234567890",
  "password": "NewPass123",
  "confirm_password": "NewPass123"
}
```
**Expected Response — Status:** `400 Bad Request`
```json
{
  "success": false,
  "message": "Invalid or expired reset token."
}
```

---

### ❌ Test Case 3 — Reusing Same Token After Reset
**Input:** (Same token used again after successful reset)
```json
{
  "reset_token": "a3f9d1c2b4e5...same token",
  "password": "AnotherPass456",
  "confirm_password": "AnotherPass456"
}
```
**Expected Response — Status:** `400 Bad Request`
```json
{
  "success": false,
  "message": "Invalid or expired reset token."
}
```

---

### ❌ Test Case 4 — Passwords Do Not Match
**Input:**
```json
{
  "reset_token": "a3f9d1c2b4e5...valid token",
  "password": "NewPass123",
  "confirm_password": "DifferentPass456"
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Passwords do not match."
}
```

---

### ❌ Test Case 5 — Weak Password (less than 8 chars)
**Input:**
```json
{
  "reset_token": "a3f9d1c2b4e5...valid token",
  "password": "pass",
  "confirm_password": "pass"
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Password must be at least 8 characters long."
}
```

---

### ❌ Test Case 6 — No Uppercase Letter
**Input:**
```json
{
  "reset_token": "a3f9d1c2b4e5...valid token",
  "password": "newpass123",
  "confirm_password": "newpass123"
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Password must contain at least one uppercase letter."
}
```

---

### ❌ Test Case 7 — No Number in Password
**Input:**
```json
{
  "reset_token": "a3f9d1c2b4e5...valid token",
  "password": "NewPassword",
  "confirm_password": "NewPassword"
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Password must contain at least one number."
}
```

---

### ❌ Test Case 8 — Missing Token Field
**Input:**
```json
{
  "password": "NewPass123",
  "confirm_password": "NewPass123"
}
```
**Expected Response — Status:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Reset token is required."
}
```

---

## 🔄 Full Flow Test (End-to-End)

Run these steps in **exact order** to test the complete forgot password flow:

```
Step 1:  POST /forgot-password.php   { "email": "john@example.com" }
                 ↓
         ✅ Check email inbox for OTP (e.g. 483920)
                 ↓
Step 2:  POST /verify-otp.php        { "email": "...", "otp": "483920" }
                 ↓
         ✅ Save reset_token from response
                 ↓
Step 3:  POST /reset-password.php    { "reset_token": "...", "password": "NewPass123", ... }
                 ↓
         ✅ Response: "Password reset successfully!"
                 ↓
Step 4:  POST /login.php             { "email": "john@example.com", "password": "NewPass123" }
                 ↓
         ✅ Login success with new password!
                 ↓
Step 5:  POST /login.php             { "email": "john@example.com", "password": "OldPassword" }
                 ↓
         ✅ 401 Unauthorized — old password no longer works!
```

---

## 📊 Error Codes Reference

| HTTP Status | Meaning | When It Happens |
|---|---|---|
| `200 OK` | Success | OTP sent, OTP verified, Password reset |
| `400 Bad Request` | Invalid data | Wrong OTP, expired OTP, invalid token |
| `405 Method Not Allowed` | Wrong method | GET on POST-only endpoint |
| `422 Unprocessable Entity` | Validation failed | Missing fields, weak password, mismatched passwords |
| `500 Internal Server Error` | Server error | DB error, Resend API failure |

---

## 🧪 Testing with Postman

### Step 1 — Import All 3 Requests

Create a **Collection** named: `Forgot Password APIs`

#### Request 1 — Send OTP
- Method: `POST`
- URL: `http://localhost/MyProjects/Backend/api/forgot-password.php`
- Body → raw → JSON:
```json
{ "email": "john@example.com" }
```

#### Request 2 — Verify OTP
- Method: `POST`
- URL: `http://localhost/MyProjects/Backend/api/verify-otp.php`
- Body → raw → JSON:
```json
{ "email": "john@example.com", "otp": "{{otp}}" }
```

#### Request 3 — Reset Password
- Method: `POST`
- URL: `http://localhost/MyProjects/Backend/api/reset-password.php`
- Body → raw → JSON:
```json
{
  "reset_token": "{{reset_token}}",
  "password": "NewPass123",
  "confirm_password": "NewPass123"
}
```

### 💡 Postman Tip — Auto-Save Token
In **Request 2** → **Tests** tab, add:
```javascript
const data = pm.response.json();
if (data.reset_token) {
    pm.environment.set("reset_token", data.reset_token);
}
```
This saves `reset_token` automatically for Request 3!

---

## 💻 Testing with cURL

### Windows CMD:

**Step 1 — Send OTP:**
```bash
curl -X POST http://localhost/MyProjects/Backend/api/forgot-password.php ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@example.com\"}"
```

**Step 2 — Verify OTP:**
```bash
curl -X POST http://localhost/MyProjects/Backend/api/verify-otp.php ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@example.com\",\"otp\":\"483920\"}"
```

**Step 3 — Reset Password:**
```bash
curl -X POST http://localhost/MyProjects/Backend/api/reset-password.php ^
  -H "Content-Type: application/json" ^
  -d "{\"reset_token\":\"YOUR_TOKEN_HERE\",\"password\":\"NewPass123\",\"confirm_password\":\"NewPass123\"}"
```

### PowerShell:
```powershell
# Step 1
Invoke-RestMethod -Uri "http://localhost/MyProjects/Backend/api/forgot-password.php" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"john@example.com"}'

# Step 2
Invoke-RestMethod -Uri "http://localhost/MyProjects/Backend/api/verify-otp.php" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"john@example.com","otp":"483920"}'

# Step 3
Invoke-RestMethod -Uri "http://localhost/MyProjects/Backend/api/reset-password.php" `
  -Method POST -ContentType "application/json" `
  -Body '{"reset_token":"YOUR_TOKEN_HERE","password":"NewPass123","confirm_password":"NewPass123"}'
```

---

## 🐛 Common Errors & Fixes

| Error | Reason | Fix |
|---|---|---|
| `"database": "error"` in health check | DB not connected | Start MySQL in XAMPP |
| `password_resets` table missing | SQL not run | Import `add_password_resets.sql` in phpMyAdmin |
| OTP email not received | Resend API key missing/wrong | Check `config/resend.php` → verify API key |
| OTP email not received | Free domain not verified | Use `onboarding@resend.dev` as sender |
| `Invalid or expired reset token` | Token already used | Request a fresh OTP and go through flow again |
| `cURL error` in PHP logs | cURL not enabled | In `php.ini` → uncomment `extension=curl` → restart Apache |
| `404 Not Found` | Wrong URL | Check file names match exactly |

---

## ✅ Quick Test Checklist

Run through this checklist to confirm everything works:

- [ ] `POST forgot-password.php` with registered email → OTP received in email
- [ ] `POST forgot-password.php` with unregistered email → Same generic message
- [ ] `POST verify-otp.php` with correct OTP → `reset_token` received
- [ ] `POST verify-otp.php` with wrong OTP → `"Invalid OTP"` error
- [ ] `POST verify-otp.php` with expired OTP → `"OTP has expired"` error
- [ ] `POST verify-otp.php` with used OTP → `"Already used"` error
- [ ] `POST reset-password.php` with valid token + strong password → Success
- [ ] `POST reset-password.php` with same token again → `"Invalid token"` error
- [ ] Login with **new password** → ✅ Works
- [ ] Login with **old password** → ✅ 401 Fails

---

*Last Updated: 2026-06-20 | Project: MyProjects Auth System — Forgot Password Feature*
