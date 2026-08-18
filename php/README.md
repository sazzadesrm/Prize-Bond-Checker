# 🇧🇩 Prize Bond Checker (PHP & MySQL Edition)

**Official 100 Tk. Bangladesh Prize Bond Checker & Portfolio Management System**  
*System Architect & Developer:* **Sazzad Kabir** (MBSTU Alumnus)  
*Email:* `sazzadmbstu@gmail.com` | *Phone:* `+88-01810-076761`

---

## 🚀 Quick Deployment Guide for Domain & Hosting (cPanel / DirectAdmin / VPS)

### 1. Database Setup (MySQL)
1. Log into your **cPanel / Hosting Control Panel** and open **phpMyAdmin** (or MySQL Database Wizard).
2. Create a new MySQL Database (e.g. `yourdomain_prizebond`).
3. Create a MySQL User and grant **ALL PRIVILEGES** to the database.
4. Open phpMyAdmin, select your database, and **Import** `database.sql`.

### 2. Configure PHP Connection
Open `config.php` and set your hosting database credentials:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'yourdomain_prizebond');
define('DB_USER', 'your_db_username');
define('DB_PASS', 'your_db_password');
```

### 3. Deploy via GitHub or FTP
- **Option A (GitHub Deployment)**:
  1. Push these files to your GitHub repository.
  2. In your cPanel > **Git™ Version Control**, clone your repository into `public_html`.
- **Option B (File Manager / FTP)**:
  1. Upload all files from the `php/` folder into your `public_html` directory.

### 4. Default Authentication Flow
- The default entry point (`index.php`) enforces the **Auth Gateway**.
- Unauthenticated visitors see the secure Login & Register page.
- Once authenticated, the full Prize Bond verification dashboard and portfolio tracker are loaded.
- Default demo credentials:
  - **Email:** `investor@prizebond.gov.bd`
  - **Password:** `password123`
  - **Admin Email:** `sazzadmbstu@gmail.com`
  - **Admin Password:** `password123`

---

## 📁 File Structure
```
├── config.php      # PDO MySQL Connection & Helper Functions
├── auth.php        # Secure Authentication API (Login, Register, Session, Logout)
├── api.php         # Prize Bond Verification Engine (Single, Batch, Portfolio)
├── database.sql    # Complete MySQL Schema + Seed Data (Draws 111-118)
├── index.php       # Standalone Responsive Web Application
└── .htaccess       # Apache Security & Rewrite Rules
```
