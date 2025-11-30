# ==============================================================================
# GITIGNORE VERIFICATION SCRIPT (PowerShell)
# ==============================================================================
# This script checks for sensitive files that should NOT be committed
# Run this before pushing to ensure no credentials are leaked
# ==============================================================================

Write-Host "🔍 Checking for sensitive files in git repository..." -ForegroundColor Cyan
Write-Host ""

$IssuesFound = 0

# Check for .env files
Write-Host "📋 Checking for .env files..." -ForegroundColor White
$EnvFiles = git ls-files | Select-String -Pattern "\.env$|\.env\." | Where-Object { $_ -notmatch "\.env\.example|\.env\.template" }
if ($EnvFiles) {
    Write-Host "❌ CRITICAL: .env files found in git:" -ForegroundColor Red
    $EnvFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    $IssuesFound++
} else {
    Write-Host "✅ No .env files found" -ForegroundColor Green
}
Write-Host ""

# Check for keys and certificates
Write-Host "📋 Checking for keys and certificates..." -ForegroundColor White
$KeyFiles = git ls-files | Select-String -Pattern "\.(pem|key|crt|jks|keystore|p12|pfx)$"
if ($KeyFiles) {
    Write-Host "❌ CRITICAL: Keys/certificates found in git:" -ForegroundColor Red
    $KeyFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    $IssuesFound++
} else {
    Write-Host "✅ No keys/certificates found" -ForegroundColor Green
}
Write-Host ""

# Check for local.properties
Write-Host "📋 Checking for local.properties..." -ForegroundColor White
$LocalProps = git ls-files | Select-String -Pattern "local\.properties"
if ($LocalProps) {
    Write-Host "❌ WARNING: local.properties found in git:" -ForegroundColor Red
    $LocalProps | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    $IssuesFound++
} else {
    Write-Host "✅ No local.properties found" -ForegroundColor Green
}
Write-Host ""

# Check for log files
Write-Host "📋 Checking for log files..." -ForegroundColor White
$LogFiles = git ls-files | Select-String -Pattern "\.log$"
if ($LogFiles) {
    Write-Host "⚠️  WARNING: Log files found in git:" -ForegroundColor Yellow
    $LogFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    $IssuesFound++
} else {
    Write-Host "✅ No log files found" -ForegroundColor Green
}
Write-Host ""

# Check for AWS credentials
Write-Host "📋 Checking for AWS credentials..." -ForegroundColor White
$AwsCreds = git ls-files | Select-String -Pattern "aws-credentials|\.aws/"
if ($AwsCreds) {
    Write-Host "❌ CRITICAL: AWS credentials found in git:" -ForegroundColor Red
    $AwsCreds | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    $IssuesFound++
} else {
    Write-Host "✅ No AWS credentials found" -ForegroundColor Green
}
Write-Host ""

# Check for database backups
Write-Host "📋 Checking for database backups..." -ForegroundColor White
$DbBackups = git ls-files | Select-String -Pattern "\.sql\.backup|\.backup$"
if ($DbBackups) {
    Write-Host "⚠️  WARNING: Database backups found in git:" -ForegroundColor Yellow
    $DbBackups | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    $IssuesFound++
} else {
    Write-Host "✅ No database backups found" -ForegroundColor Green
}
Write-Host ""

# Check for MASTER.env
Write-Host "📋 Checking for MASTER.env..." -ForegroundColor White
$MasterEnv = git ls-files | Select-String -Pattern "MASTER\.env"
if ($MasterEnv) {
    Write-Host "❌ CRITICAL: MASTER.env found in git:" -ForegroundColor Red
    $MasterEnv | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    $IssuesFound++
} else {
    Write-Host "✅ No MASTER.env found" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "============================================================" -ForegroundColor Cyan
if ($IssuesFound -eq 0) {
    Write-Host "✅ ALL CHECKS PASSED - No sensitive files found!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "❌ ISSUES FOUND: $IssuesFound" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Remove these files before committing!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To remove a file from git tracking:" -ForegroundColor White
    Write-Host "  git rm --cached path/to/file" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To remove from history (if already committed):" -ForegroundColor White
    Write-Host "  1. Rotate the credentials immediately" -ForegroundColor Gray
    Write-Host "  2. Use BFG Repo-Cleaner or git filter-branch" -ForegroundColor Gray
    Write-Host "  3. Force push to remote" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

