-- ============================================
-- Auth System — Forgot Password Database Setup
-- Run this script in phpMyAdmin or MySQL CLI
-- ============================================

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
