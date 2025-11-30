# Security Guidelines

## 🔒 Sensitive Files - NEVER COMMIT

The following files contain sensitive information and should **NEVER** be committed to version control:

### Environment Variables
- `.env` files (all variants)
- `MASTER.env`
- `backend/services/gateway/.env`
- `admin/.env`
- Any file containing database credentials, API keys, or secrets

### Android Signing Keys
- `*.jks` (Java KeyStore)
- `*.keystore`
- `keystore.properties`
- Any file in `android/app/release/`

### Certificates & Keys
- `*.pem` (Private keys)
- `*.key` (Private keys)
- `*.crt` (Certificates)
- `*.p12` (PKCS#12 certificates)
- `*.pfx` (Personal Information Exchange)

### AWS & Cloud Credentials
- `.aws/` directory
- `aws-credentials.json`
- `gcloud-credentials.json`
- `service-account.json`

### Database Files
- `*.sql.backup`
- `*.backup`
- Database dumps with real data

## ✅ Safe to Commit

The following template files are safe to commit (they contain no real credentials):

- `.env.example`
- `.env.template`
- `backend/.env.example`
- `admin/.env.example`

## 🛡️ Best Practices

1. **Use Environment Variables**: Never hardcode credentials in source code
2. **Use Template Files**: Provide `.env.example` files with placeholder values
3. **Rotate Credentials**: If credentials are accidentally committed, rotate them immediately
4. **Use Secrets Management**: Consider AWS Secrets Manager, HashiCorp Vault, or similar
5. **Review Before Commit**: Always review `git status` and `git diff` before committing

## 🚨 If Credentials Are Accidentally Committed

1. **Rotate the credentials immediately** (change passwords, regenerate API keys)
2. **Remove from git history** using `git filter-branch` or BFG Repo-Cleaner
3. **Force push** to remote repository (coordinate with team)
4. **Notify security team** if applicable

## 📋 Checklist Before Committing

- [ ] No `.env` files in staged changes
- [ ] No `local.properties` in staged changes
- [ ] No `.log` files in staged changes
- [ ] No database credentials in code
- [ ] No API keys in code
- [ ] No signing keys or certificates
- [ ] Reviewed `git status` output
- [ ] Reviewed `git diff --cached` output

## 🔍 Verify Gitignore

Run this command to check for sensitive files:

```bash
# Check for .env files
git ls-files | grep -E "\.env$|\.env\."

# Check for keys and certificates
git ls-files | grep -E "\.(pem|key|crt|jks|keystore)$"

# Check for local properties
git ls-files | grep "local.properties"
```

If any sensitive files are found, remove them from git tracking:

```bash
git rm --cached path/to/sensitive/file
git commit -m "Remove sensitive file from tracking"
```

