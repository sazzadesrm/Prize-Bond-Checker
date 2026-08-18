-- ==========================================================
-- Bangladesh Prize Bond Checker - Full Database Schema (MySQL/MariaDB)
-- Developer: Sazzad Kabir (sazzadmbstu@gmail.com / +88-01810-076761)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `prizebond_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `prizebond_db`;

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(50) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') DEFAULT 'user',
  `is_premium` TINYINT(1) DEFAULT 1,
  `language` VARCHAR(10) DEFAULT 'bn',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `draws`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `draws` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `draw_number` INT NOT NULL UNIQUE,
  `scheduled_date` DATE NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `status` ENUM('completed', 'upcoming') DEFAULT 'completed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `draw_results`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `draw_results` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `draw_id` INT NOT NULL,
  `prize_tier` INT NOT NULL COMMENT '1: 1st, 2: 2nd, 3: 3rd, 4: 4th, 5: 5th',
  `prize_amount` DECIMAL(12,2) NOT NULL,
  `bond_number` VARCHAR(10) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_draw_bond` (`draw_id`, `bond_number`),
  INDEX `idx_bond_number` (`bond_number`),
  FOREIGN KEY (`draw_id`) REFERENCES `draws`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `portfolio_bonds`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `portfolio_bonds` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `bond_series` VARCHAR(10) NOT NULL DEFAULT 'KA',
  `bond_number` VARCHAR(10) NOT NULL,
  `purchase_date` DATE DEFAULT NULL,
  `notes` VARCHAR(255) DEFAULT NULL,
  `is_winner` TINYINT(1) DEFAULT 0,
  `winning_prize_tier` INT DEFAULT NULL,
  `winning_amount` DECIMAL(12,2) DEFAULT 0.00,
  `winning_draw_number` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_bonds` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `notifications`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) DEFAULT 'system',
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- SEED DATA (Default Admin, Sample User, and Official Draws)
-- ==========================================================

-- Default Users (Password for both is: password123)
-- Hash generated using PHP password_hash('password123', PASSWORD_BCRYPT)
INSERT INTO `users` (`name`, `email`, `phone`, `password_hash`, `role`, `is_premium`, `language`) VALUES
('Sazzad Kabir', 'sazzadmbstu@gmail.com', '+88-01810-076761', '$2y$10$eA09Y8j/sT/Uj3Y7J1k8l.nI8o1F7hM.L3J6F1K5U6qg3I0jQ2g2a', 'admin', 1, 'bn'),
('Demo Investor', 'investor@prizebond.gov.bd', '01810076761', '$2y$10$eA09Y8j/sT/Uj3Y7J1k8l.nI8o1F7hM.L3J6F1K5U6qg3I0jQ2g2a', 'user', 1, 'bn')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Official 100 Tk. Bangladesh Prize Bond Draws
INSERT INTO `draws` (`draw_number`, `scheduled_date`, `location`, `status`) VALUES
(119, '2025-07-31', 'Barishal', 'upcoming'),
(118, '2025-04-30', 'Dhaka', 'completed'),
(117, '2025-01-31', 'Chattogram', 'completed'),
(116, '2024-10-31', 'Rajshahi', 'completed'),
(115, '2024-07-31', 'Khulna', 'completed'),
(114, '2024-04-30', 'Sylhet', 'completed'),
(113, '2024-01-31', 'Mymensingh', 'completed'),
(112, '2023-10-31', 'Rangpur', 'completed'),
(111, '2023-07-31', 'Dhaka', 'completed')
ON DUPLICATE KEY UPDATE `scheduled_date`=VALUES(`scheduled_date`);

-- Winning Numbers for Draw 118 (Dhaka)
INSERT INTO `draw_results` (`draw_id`, `prize_tier`, `prize_amount`, `bond_number`)
SELECT `id`, 1, 600000.00, '0528419' FROM `draws` WHERE `draw_number` = 118;

INSERT INTO `draw_results` (`draw_id`, `prize_tier`, `prize_amount`, `bond_number`)
SELECT `id`, 2, 325000.00, '0743912' FROM `draws` WHERE `draw_number` = 118;

INSERT INTO `draw_results` (`draw_id`, `prize_tier`, `prize_amount`, `bond_number`)
SELECT `id`, 3, 100000.00, '0129481' FROM `draws` WHERE `draw_number` = 118 UNION ALL
SELECT `id`, 3, 100000.00, '0983210' FROM `draws` WHERE `draw_number` = 118;

INSERT INTO `draw_results` (`draw_id`, `prize_tier`, `prize_amount`, `bond_number`)
SELECT `id`, 4, 50000.00, '0482910' FROM `draws` WHERE `draw_number` = 118 UNION ALL
SELECT `id`, 4, 50000.00, '0612984' FROM `draws` WHERE `draw_number` = 118;

INSERT INTO `draw_results` (`draw_id`, `prize_tier`, `prize_amount`, `bond_number`)
SELECT `id`, 5, 10000.00, '0019284' FROM `draws` WHERE `draw_number` = 118 UNION ALL
SELECT `id`, 5, 10000.00, '0182749' FROM `draws` WHERE `draw_number` = 118 UNION ALL
SELECT `id`, 5, 10000.00, '0391824' FROM `draws` WHERE `draw_number` = 118 UNION ALL
SELECT `id`, 5, 10000.00, '0750750' FROM `draws` WHERE `draw_number` = 118 UNION ALL
SELECT `id`, 5, 10000.00, '0891234' FROM `draws` WHERE `draw_number` = 118;

-- Winning Numbers for Draw 117 (Chattogram)
INSERT INTO `draw_results` (`draw_id`, `prize_tier`, `prize_amount`, `bond_number`)
SELECT `id`, 1, 600000.00, '0639102' FROM `draws` WHERE `draw_number` = 117;

INSERT INTO `draw_results` (`draw_id`, `prize_tier`, `prize_amount`, `bond_number`)
SELECT `id`, 2, 325000.00, '0192847' FROM `draws` WHERE `draw_number` = 117;
