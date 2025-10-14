# Only Coffee Android Hot Reload Script
# Usage: .\hot-reload.ps1

Write-Host "🔥 Only Coffee Hot Reload Starting..." -ForegroundColor Yellow

# Set Java Home
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Change to Android directory
Set-Location $PSScriptRoot

Write-Host "📱 Building debug APK..." -ForegroundColor Cyan
$buildResult = & .\gradle-8.2\bin\gradle.bat :app:assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    Write-Host "📲 Installing on emulator..." -ForegroundColor Cyan
    $installResult = & .\gradle-8.2\bin\gradle.bat :app:installDebug
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Install successful!" -ForegroundColor Green
        
        Write-Host "🚀 Launching app..." -ForegroundColor Cyan
        & "C:\Users\sayalew\AppData\Local\Android\Sdk\platform-tools\adb.exe" shell monkey -p com.onlycoffee.app -c android.intent.category.LAUNCHER 1
        
        Write-Host "🎉 Hot reload complete! App is running with your changes." -ForegroundColor Green
    } else {
        Write-Host "❌ Install failed!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
}

Write-Host "⏱️  Total time: $((Get-Date) - $startTime)" -ForegroundColor Magenta
