@echo off
echo 🔥 Only Coffee Hot Reload Starting...

set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr

echo 📱 Building debug APK...
call gradle-8.2\bin\gradle.bat :app:assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build successful!
    
    echo 📲 Installing on emulator...
    call gradle-8.2\bin\gradle.bat :app:installDebug
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Install successful!
        
        echo 🚀 Launching app...
        "C:\Users\sayalew\AppData\Local\Android\Sdk\platform-tools\adb.exe" shell monkey -p com.onlycoffee.app.debug -c android.intent.category.LAUNCHER 1
        
        echo 🎉 Hot reload complete! App is running with your changes.
    ) else (
        echo ❌ Install failed!
    )
) else (
    echo ❌ Build failed!
)

pause
