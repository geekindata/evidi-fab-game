# Security Checklist

## ⚠️ Never Commit These Files

- `start_flask.ps1` - Contains connection string with server/database names
- `create_azuread_user.sql` - Contains email addresses
- `flask_app.log` - May contain sensitive connection strings in logs
- `.env` - Environment variables
- Any file with actual connection strings, passwords, or credentials

## ✅ Safe to Commit

- `start_flask.ps1.example` - Template file (no real credentials)
- `create_azuread_user.sql.example` - Template file (no real credentials)
- `app.py` - Code only (reads from environment variables)
- `README.md` - Documentation (uses placeholders)
- All other code files

## 🔒 Connection String Security

**Never hardcode connection strings in code!**

✅ **Good:**
- Connection string in environment variable
- Connection string in `.env` file (excluded from git)
- Connection string in `start_flask.ps1` (excluded from git)
- Connection string in Azure App Settings (not in code)

❌ **Bad:**
- Connection string hardcoded in `app.py`
- Connection string in `README.md` with real values
- Connection string committed to git

## 📋 Pre-Commit Checklist

Before committing to git:

- [ ] No real connection strings in any file
- [ ] No passwords or credentials in code
- [ ] No email addresses in SQL files (use templates)
- [ ] `start_flask.ps1` is excluded (check `.gitignore`)
- [ ] `create_azuread_user.sql` is excluded (check `.gitignore`)
- [ ] Log files are excluded (check `.gitignore`)
- [ ] All sensitive files use `.example` suffix for templates

## 🛡️ Current Protection

The `.gitignore` file excludes:
- `start_flask.ps1` (contains real connection string)
- `create_azuread_user.sql` (contains real email)
- `*.log` (log files may contain sensitive info)
- `.env` (environment variables)

## 📝 Template Files

Use these template files and copy them locally:
- `start_flask.ps1.example` → Copy to `start_flask.ps1` (not committed)
- `create_azuread_user.sql.example` → Copy to `create_azuread_user.sql` (not committed)
