Write-Host "Only Coffee Auto Reload Starting..." -ForegroundColor Cyan
Write-Host ""

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$ADB_PATH = "C:\Users\sayalew\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$PACKAGE_NAME = "com.onlycoffee.app.debug"
$GRADLE_PATH = ".\gradle-8.2\bin\gradle.bat"

function Build-And-Deploy {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] Building and deploying..." -ForegroundColor Yellow
    
    # Build
    & $GRADLE_PATH :app:assembleDebug
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[$timestamp] Build successful!" -ForegroundColor Green
        
        # Install
        & $GRADLE_PATH :app:installDebug
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$timestamp] Install successful!" -ForegroundColor Green
            
            # Launch
            & $ADB_PATH shell monkey -p $PACKAGE_NAME -c android.intent.category.LAUNCHER 1 2>$null
            Write-Host "[$timestamp] App launched!" -ForegroundColor Green
        } else {
            Write-Host "[$timestamp] Install failed!" -ForegroundColor Red
        }
    } else {
        Write-Host "[$timestamp] Build failed!" -ForegroundColor Red
    }
    Write-Host ""
}

# Check if emulator is connected
$devices = & $ADB_PATH devices 2>$null | Select-String "device$"
if (-not $devices) {
    Write-Host "No Android emulator connected. Please start your emulator first." -ForegroundColor Red
    exit 1
}

Write-Host "Emulator detected. Starting file watcher..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

$lastCheck = @{}
$watchPaths = @("app\src\main\java", "app\src\main\res")

while ($true) {
    $changed = $false
    
    foreach ($path in $watchPaths) {
        if (Test-Path $path) {
            $files = Get-ChildItem -Path $path -Recurse -Include "*.kt", "*.xml" -File
            foreach ($file in $files) {
                $key = $file.FullName
                $time = $file.LastWriteTime
                
                if ($lastCheck.ContainsKey($key)) {
                    if ($lastCheck[$key] -lt $time) {
                        $changed = $true
                        $lastCheck[$key] = $time
                        Write-Host "Change detected: $($file.Name)" -ForegroundColor Cyan
                        break
                    }
                } else {
                    $lastCheck[$key] = $time
                }
            }
            if ($changed) { break }
        }
    }
    
    if ($changed) {
        Start-Sleep -Seconds 2
        Build-And-Deploy
    }
    
    Start-Sleep -Seconds 1
}
