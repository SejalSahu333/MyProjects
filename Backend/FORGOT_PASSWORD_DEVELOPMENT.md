# 🔑 Forgot Password Feature — Development Plan

> **Project:** MyProjects Auth System  
> **Feature:** Forgot Password with OTP via Resend.com  
> **Stack:** PHP 8+ | MySQL | Apache (XAMPP) | Resend.com API  
> **Date:** 2026-06-20

---

## 📋 Table of Contents

1. [Feature Overview](#-feature-overview)
2. [Folder & File Structure](#-folder--file-structure)
3. [Database Setup](#-step-1-database-setup)
4. [Resend.com Setup](#-step-2-resendcom-setup)
5. [Backend Development](#-step-3-backend-development)
   - [config/resend.php](#31-configresendphp)
   - [forgot-password.php](#32-apiforgot-passwordphp)
   - [verify-otp.php](#33-apiverify-otpphp)
   - [reset-password.php](#34-apireset-passwordphp)
6. [Frontend Development](#-step-4-frontend-development)
   - [forgot-password.html](#41-forgot-passwordhtml)
   - [verify-otp.html](#42-verify-otphtml)
   - [reset-password.html](#43-reset-passwordhtml)
7. [Update Existing Files](#-step-5-update-existing-files)
8. [Security Checklist](#-security-checklist)
9. [Implementation Order](#-implementation-order)
10. [Done Checklist](#-done-checklist)

---

## 🎯 Feature Overview

Allow registered users to reset their forgotten password via:

```
Email Input → OTP Sent (Resend.com) → OTP Verified → New Password Set
```

### Key Decisions:
| Setting | Value |
|---|---|
| OTP Length | 6 digits |
| OTP Expiry | 10 minutes |
| Email Service | Resend.com (REST API via PHP cURL) |
| Token Type | 64-char hex (bin2hex random_bytes) |
| Password Hash | bcrypt via password_hash() |
| Old OTP Cleanup | Yes — delete before generating new |

---

## 📁 Folder & File Structure

```
MyProjects/
│
├── Backend/
│   ├── config/
│   │   ├── database.php            [EXISTS]
│   │   ├── cors.php                [EXISTS]
│   │   └── resend.php              ✅ [NEW] Resend API key + sender config
│   │
│   ├── api/
│   │   ├── health.php              [EXISTS]
│   │   ├── register.php            [EXISTS]
│   │   ├── login.php               [EXISTS]
│   │   ├── forgot-password.php     ✅ [NEW] Step 1 — Send OTP
│   │   ├── verify-otp.php          ✅ [NEW] Step 2 — Verify OTP
│   │   └── reset-password.php      ✅ [NEW] Step 3 — Set New Password
│   │
│   └── database/
│       ├── setup.sql               [EXISTS]
│       └── add_password_resets.sql ✅ [NEW] New table SQL
│
└── Frontend/
    ├── login.html                  [MODIFY] Update forgot password link
    ├── forgot-password.html        ✅ [NEW] Email input page
    ├── verify-otp.html             ✅ [NEW] OTP input + timer page
    ├── reset-password.html         ✅ [NEW] New password page
    │
    ├── css/
    │   └── style.css               [EXISTS] Shared styles (no changes needed)
    │
    └── js/
        ├── register.js             [EXISTS]
        ├── login.js                [EXISTS]
        ├── forgot-password.js      ✅ [NEW]
        ├── verify-otp.js           ✅ [NEW] OTP input + countdown timer
        └── reset-password.js       ✅ [NEW]
```

**Total New Files: 9** | **Modified Files: 1**

---

## 🗄️ STEP 1: Database Setup

### File: `Backend/database/add_password_resets.sql`

```sql
USE auth_system;

CREATE TABLE IF NOT EXISTS password_resets (
    id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    email       VARCHAR(150)  NOT NULL,
    otp         VARCHAR(6)    NOT NULL,
    reset_token VARCHAR(64)   NULL DEFAULT NULL,
    expires_at  DATETIME      NOT NULL,
    is_used     TINYINT(1)    NOT NULL DEFAULT 0,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_email (email),
    INDEX idx_otp   (otp),
    INDEX idx_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### How to Run:
1. Open **phpMyAdmin** → `http://localhost/phpmyadmin`
2. Click on `auth_system` database (left sidebar)
3. Click **Import** tab
4. Choose file: `Backend/database/add_password_resets.sql`
5. Click **Go**

### Verify Table Created:
```sql
DESCRIBE password_resets;
```
Should show columns: `id`, `email`, `otp`, `reset_token`, `expires_at`, `is_used`, `created_at`

---

## 📧 STEP 2: Resend.com Setup

### Create Account:
1. Go to → [https://resend.com](https://resend.com)
2. Sign up (free — 100 emails/day)
3. Go to **API Keys** section
4. Click **"Create API Key"** → Copy the key (starts with `re_`)

### Free Tier Sender Email:
- Use `onboarding@resend.dev` as the "from" email
- This works on free plan **without domain verification**
- For production: verify your own domain in Resend dashboard

### File: `Backend/config/resend.php`

```php
<?php
// Resend.com Email API Configuration
define('RESEND_API_KEY',    're_YOUR_API_KEY_HERE');   // ← Paste your key
define('RESEND_FROM_EMAIL', 'onboarding@resend.dev'); // ← Free plan sender
define('RESEND_FROM_NAME',  'AuthSystem');

/**
 * Send email via Resend.com REST API using PHP cURL
 *
 * @param string $toEmail    Recipient email
 * @param string $subject    Email subject
 * @param string $htmlBody   HTML email body
 * @return bool              true = sent, false = failed
 */
function sendEmail(string $toEmail, string $subject, string $htmlBody): bool {
    $payload = [
        'from'    => RESEND_FROM_NAME . ' <' . RESEND_FROM_EMAIL . '>',
        'to'      => [$toEmail],
        'subject' => $subject,
        'html'    => $htmlBody,
    ];

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . RESEND_API_KEY,
            'Content-Type: application/json',
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $httpCode === 200 || $httpCode === 201;
}
?>
```

---

## 🖥️ STEP 3: Backend Development

### 3.1 `api/forgot-password.php`

**Purpose:** Accept email → generate OTP → send via Resend → save in DB

**Key Code Logic:**
```php
// 1. Validate email
// 2. Check email exists in users table
// 3. Delete old OTPs for this email
// 4. Generate 6-digit OTP
$otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

// 5. Set expiry = NOW + 10 minutes
$expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));

// 6. Save OTP to password_resets table
INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)

// 7. Build OTP email HTML
// 8. Call sendEmail() from resend.php
// 9. Return generic success message (don't reveal if email exists)
```

**OTP Email HTML Template:**
```html
<div style="font-family:sans-serif; max-width:480px; margin:auto; 
            background:#0a0e1a; color:#f1f5f9; padding:32px; border-radius:16px;">
  <h2 style="color:#6366f1;">🔐 Password Reset OTP</h2>
  <p>Your one-time password to reset your AuthSystem password:</p>
  <div style="font-size:40px; font-weight:bold; letter-spacing:12px;
              background:#1e1b4b; padding:24px; text-align:center;
              border-radius:12px; color:#a5b4fc; margin:20px 0;">
    {OTP_CODE}
  </div>
  <p>⏱️ This OTP is valid for <strong>10 minutes</strong>.</p>
  <p style="color:#94a3b8; font-size:12px;">
    If you did not request this, please ignore this email.
  </p>
</div>
```

---

### 3.2 `api/verify-otp.php`

**Purpose:** Validate OTP → return secure reset_token

**Key Code Logic:**
```php
// 1. Validate email + otp fields
// 2. Query password_resets table
SELECT * FROM password_resets
WHERE email = ? AND otp = ? AND is_used = 0 AND expires_at > NOW()
ORDER BY created_at DESC LIMIT 1

// 3. If not found → "Invalid OTP"
// 4. If found but expired → "OTP has expired"
// 5. If found and valid:
$resetToken = bin2hex(random_bytes(32));  // 64-char secure token

// 6. Save token in same row
UPDATE password_resets SET reset_token = ? WHERE id = ?

// 7. Return reset_token to frontend
```

---

### 3.3 `api/reset-password.php`

**Purpose:** Validate reset_token → hash new password → update users table

**Key Code Logic:**
```php
// 1. Validate reset_token + password fields
// 2. Password rules: 8+ chars, 1 uppercase, 1 number
// 3. Confirm passwords match
// 4. Lookup token in password_resets
SELECT * FROM password_resets
WHERE reset_token = ? AND is_used = 0 AND expires_at > NOW()

// 5. Get email from the token row
// 6. Hash new password
$hashed = password_hash($newPassword, PASSWORD_BCRYPT);

// 7. Update users table
UPDATE users SET password = ? WHERE email = ?

// 8. Mark OTP row as used
UPDATE password_resets SET is_used = 1 WHERE id = ?

// 9. Return success
```

---

## 🎨 STEP 4: Frontend Development

### Design Approach:
- Same dark glassmorphism style as `register.html` and `login.html`
- Same shared CSS file: `css/style.css` (no changes needed)
- Same brand header: 🔐 AuthSystem

---

### 4.1 `forgot-password.html`

**Elements:**
- Brand header (🔐 AuthSystem)
- Heading: "Forgot Password?"
- Subtext: "Enter your email and we'll send you an OTP"
- Email input field
- "Send OTP" button (with loading spinner)
- Alert boxes (success/error)
- Link back to login

**JS Logic (`forgot-password.js`):**
```javascript
// On form submit:
// 1. Validate email format client-side
// 2. POST to /api/forgot-password.php
// 3. On success → store email in sessionStorage
//    sessionStorage.setItem('reset_email', email)
// 4. Redirect to verify-otp.html
```

---

### 4.2 `verify-otp.html`

**Elements:**
- Brand header
- Heading: "Enter OTP"
- Subtext: "6-digit code sent to your email"
- **6 individual digit boxes** (auto-tab to next on input)
- **Countdown timer** (10:00 → 00:00)
- "Resend OTP" button (disabled until timer ends)
- "Verify OTP" button
- Alert boxes

**JS Logic (`verify-otp.js`):**
```javascript
// On page load:
// 1. Get email from sessionStorage
// 2. Start 10-minute countdown timer

// OTP Input Boxes:
// - 6 separate <input maxlength="1"> boxes
// - Auto-focus next box on digit entry
// - Auto-focus previous box on Backspace
// - Paste support (split 6 digits across boxes)

// Countdown Timer:
let seconds = 600; // 10 minutes
const timer = setInterval(() => {
    seconds--;
    // display MM:SS format
    if (seconds <= 0) {
        clearInterval(timer);
        // enable Resend OTP button
    }
}, 1000);

// On Verify:
// 1. Combine 6 boxes into one OTP string
// 2. POST to /api/verify-otp.php { email, otp }
// 3. On success → store reset_token in sessionStorage
//    sessionStorage.setItem('reset_token', data.reset_token)
// 4. Redirect to reset-password.html

// On Resend:
// 1. POST to /api/forgot-password.php again
// 2. Reset timer to 10:00
// 3. Disable resend button again
```

---

### 4.3 `reset-password.html`

**Elements:**
- Brand header
- Heading: "Create New Password"
- New Password input (with toggle visibility)
- Confirm Password input (with toggle visibility)
- Password strength meter (same as register page)
- "Reset Password" button
- Alert boxes

**JS Logic (`reset-password.js`):**
```javascript
// On page load:
// 1. Get reset_token from sessionStorage
// 2. If no token → redirect to forgot-password.html

// On submit:
// 1. Validate password rules client-side
// 2. POST to /api/reset-password.php { reset_token, password, confirm_password }
// 3. On success:
//    - Clear sessionStorage (email, reset_token)
//    - Show success alert
//    - Redirect to login.html after 2 seconds
```

---

## 🔗 STEP 5: Update Existing Files

### `Frontend/login.html`

Find the existing forgot password link:
```html
<!-- Current (placeholder) -->
<a href="#" id="forgotLink">Forgot password?</a>
```

Update to:
```html
<!-- Updated -->
<a href="forgot-password.html" id="forgotLink">Forgot password?</a>
```

Also update `login.js` — remove the `forgotLink` click event handler (the `#` placeholder alert).

---

## 🔐 Security Checklist

| # | Security Measure | Where Implemented |
|---|---|---|
| 1 | OTP expires in 10 minutes | `expires_at` checked in `verify-otp.php` |
| 2 | OTP single-use only | `is_used = 1` flag after verify |
| 3 | Old OTPs deleted before new one | `forgot-password.php` — DELETE before INSERT |
| 4 | Reset token is cryptographically random | `bin2hex(random_bytes(32))` |
| 5 | Reset token also expires (same 10 min window) | `expires_at` checked in `reset-password.php` |
| 6 | Email enumeration prevented | Same response for registered & unregistered email |
| 7 | Password hashed with bcrypt | `password_hash($pwd, PASSWORD_BCRYPT)` |
| 8 | PDO prepared statements | All DB queries use `?` placeholders |
| 9 | CORS headers on all APIs | `cors.php` included in every API file |
| 10 | Session data cleared after reset | `sessionStorage.clear()` after success |

---

## 📋 Implementation Order

Work through files in this exact order to avoid dependency issues:

```
✅ DONE ALREADY:
   - users table exists
   - register.php + login.php working

📌 DO IN ORDER:

[ ] 1. Run add_password_resets.sql in phpMyAdmin
[ ] 2. Create config/resend.php (add your API key)
[ ] 3. Create api/forgot-password.php
[ ] 4. Test Step 3 alone with Postman first
[ ] 5. Create api/verify-otp.php
[ ] 6. Test Steps 3+5 together with Postman
[ ] 7. Create api/reset-password.php
[ ] 8. Test all 3 APIs end-to-end with Postman
[ ] 9. Create Frontend/forgot-password.html + js/forgot-password.js
[ ] 10. Create Frontend/verify-otp.html + js/verify-otp.js
[ ] 11. Create Frontend/reset-password.html + js/reset-password.js
[ ] 12. Update login.html forgot password link
[ ] 13. Full browser test — complete flow
[ ] 14. Verify old password no longer works after reset
```

---

## ✅ Done Checklist

Mark each item when complete:

### Database
- [ ] `password_resets` table created
- [ ] Table visible in phpMyAdmin under `auth_system`

### Resend.com
- [ ] Account created at resend.com
- [ ] API key copied
- [ ] `config/resend.php` created with API key

### Backend APIs
- [ ] `api/forgot-password.php` created
- [ ] `api/verify-otp.php` created
- [ ] `api/reset-password.php` created
- [ ] All 3 APIs tested via Postman

### Frontend Pages
- [ ] `forgot-password.html` + `forgot-password.js` created
- [ ] `verify-otp.html` + `verify-otp.js` created (with timer + 6-box OTP)
- [ ] `reset-password.html` + `reset-password.js` created
- [ ] `login.html` updated with correct forgot password link

### Final Verification
- [ ] OTP received in email inbox
- [ ] OTP verified successfully
- [ ] New password set
- [ ] Login with new password works ✅
- [ ] Login with old password fails ✅

---

## 📁 Related Files

| File | Purpose |
|---|---|
| [API_TESTING.md](./API_TESTING.md) | Register + Login API testing guide |
| [FORGOT_PASSWORD_TESTING.md](./FORGOT_PASSWORD_TESTING.md) | Forgot password API test cases |
| [database/setup.sql](./database/setup.sql) | Original DB setup (users table) |
| [database/add_password_resets.sql](./database/add_password_resets.sql) | New table SQL |

---

*Development Plan Created: 2026-06-20 | MyProjects Auth System*
