#!/usr/bin/env powershell

# 🔥 Only Coffee Android Auto Hot Reload
# Watches for file changes and automatically rebuilds and deploys the app

param(
    [switch]$FullRebuild = $false,
    [int]$DebounceMs = 2000,
    [switch]$Verbose = $false
)

# Configuration
$JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$ADB_PATH = "C:\Users\sayalew\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$PACKAGE_NAME = "com.onlycoffee.app.debug"
$GRADLE_PATH = ".\gradle-8.2\bin\gradle.bat"

# Paths to watch
$WATCH_PATHS = @(
    "app\src\main\java",
    "app\src\main\res",
    "app\src\main\AndroidManifest.xml",
    "app\build.gradle.kts",
    "build.gradle.kts"
)

# File extensions to watch
$WATCH_EXTENSIONS = @("*.kt", "*.xml", "*.kts", "*.json", "*.properties")

Write-Host "🔥 Only Coffee Auto Hot Reload Starting..." -ForegroundColor Cyan
Write-Host "📁 Watching paths: $($WATCH_PATHS -join ', ')" -ForegroundColor Yellow
Write-Host "⏱️  Debounce delay: ${DebounceMs}ms" -ForegroundColor Yellow
Write-Host "🎯 Target package: $PACKAGE_NAME" -ForegroundColor Yellow
Write-Host ""

# Set environment
$env:JAVA_HOME = $JAVA_HOME

# Check prerequisites
function Test-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check Java Home
    if (-not (Test-Path $JAVA_HOME)) {
        Write-Host "❌ Java Home not found: $JAVA_HOME" -ForegroundColor Red
        return $false
    }
    
    # Check ADB
    if (-not (Test-Path $ADB_PATH)) {
        Write-Host "❌ ADB not found: $ADB_PATH" -ForegroundColor Red
        return $false
    }
    
    # Check Gradle
    if (-not (Test-Path $GRADLE_PATH)) {
        Write-Host "❌ Gradle not found: $GRADLE_PATH" -ForegroundColor Red
        return $false
    }
    
    # Check emulator
    $devices = & $ADB_PATH devices 2>$null | Select-String "device$"
    if (-not $devices) {
        Write-Host "❌ No Android emulator/device connected" -ForegroundColor Red
        Write-Host "   Please start your emulator first" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "✅ All prerequisites met!" -ForegroundColor Green
    return $true
}

# Build and deploy function
function Invoke-HotReload {
    param([string]$ChangedFile = "")
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    if ($ChangedFile) {
        Write-Host "[$timestamp] 📝 File changed: $ChangedFile" -ForegroundColor Cyan
    }
    
    Write-Host "[$timestamp] 🔨 Building debug APK..." -ForegroundColor Yellow
    
    # Build
    $buildResult = & $GRADLE_PATH :app:assembleDebug 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[$timestamp] ❌ Build failed!" -ForegroundColor Red
        if ($Verbose) {
            Write-Host $buildResult -ForegroundColor Red
        }
        return
    }
    
    Write-Host "[$timestamp] ✅ Build successful!" -ForegroundColor Green
    
    # Install
    Write-Host "[$timestamp] 📲 Installing on device..." -ForegroundColor Yellow
    $installResult = & $GRADLE_PATH :app:installDebug 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[$timestamp] ❌ Install failed!" -ForegroundColor Red
        if ($Verbose) {
            Write-Host $installResult -ForegroundColor Red
        }
        return
    }
    
    Write-Host "[$timestamp] ✅ Install successful!" -ForegroundColor Green
    
    # Launch
    Write-Host "[$timestamp] 🚀 Launching app..." -ForegroundColor Yellow
    & $ADB_PATH shell monkey -p $PACKAGE_NAME -c android.intent.category.LAUNCHER 1 2>$null
    
    Write-Host "[$timestamp] 🎉 Hot reload complete!" -ForegroundColor Green
    Write-Host ""
}

# Initial check
if (-not (Test-Prerequisites)) {
    Write-Host "❌ Prerequisites not met. Exiting." -ForegroundColor Red
    exit 1
}

# Initial build if requested
if ($FullRebuild) {
    Write-Host "🧹 Performing initial full rebuild..." -ForegroundColor Cyan
    & $GRADLE_PATH clean 2>$null
    Invoke-HotReload
}

Write-Host "👀 Watching for changes... (Press Ctrl+C to stop)" -ForegroundColor Green
Write-Host ""

# File system watcher setup
$watchers = @()
$lastChangeTime = [DateTime]::MinValue
$timer = New-Object System.Timers.Timer
$timer.Interval = $DebounceMs
$timer.AutoReset = $false

# Timer event handler
$timerAction = {
    Invoke-HotReload
}

Register-ObjectEvent -InputObject $timer -EventName Elapsed -Action $timerAction | Out-Null

# File change handler
$changeAction = {
    param($sender, $e)
    
    $path = $e.FullPath
    $changeType = $e.ChangeType
    $name = $e.Name
    
    # Skip temporary files and build outputs
    if ($name -match '\.(tmp|bak|swp)$' -or $path -match '\\build\\' -or $path -match '\\.gradle\\') {
        return
    }
    
    $now = Get-Date
    $script:lastChangeTime = $now
    
    if ($Verbose) {
        Write-Host "📁 Change detected: $name ($changeType)" -ForegroundColor Gray
    }
    
    # Restart the debounce timer
    $timer.Stop()
    $timer.Start()
}

# Create watchers for each path
foreach ($watchPath in $WATCH_PATHS) {
    if (Test-Path $watchPath) {
        foreach ($extension in $WATCH_EXTENSIONS) {
            $watcher = New-Object System.IO.FileSystemWatcher
            $watcher.Path = Resolve-Path $watchPath
            $watcher.Filter = $extension
            $watcher.IncludeSubdirectories = $true
            $watcher.EnableRaisingEvents = $true
            
            Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $changeAction | Out-Null
            Register-ObjectEvent -InputObject $watcher -EventName Created -Action $changeAction | Out-Null
            Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $changeAction | Out-Null
            
            $watchers += $watcher
        }
    }
}

Write-Host "✅ File watchers active for $($watchers.Count) patterns" -ForegroundColor Green
Write-Host "💡 Make changes to your Kotlin/XML files and they'll auto-reload!" -ForegroundColor Cyan
Write-Host ""

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    # Cleanup
    Write-Host "🧹 Cleaning up watchers..." -ForegroundColor Yellow
    foreach ($watcher in $watchers) {
        $watcher.EnableRaisingEvents = $false
        $watcher.Dispose()
    }
    $timer.Dispose()
    Write-Host "👋 Auto hot reload stopped." -ForegroundColor Cyan
}
