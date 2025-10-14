# 🔥 Only Coffee Android Hot Reload Guide

This guide shows you how to use hot reload for faster development with the Only Coffee Android app.

## ⚡ **NEW: Automatic Live Reload**

### **🎯 Start Auto-Reload (Recommended)**
**Automatically rebuilds and deploys when you save files!**

**VSCode Shortcut:** `Ctrl+Shift+A`
**Command Palette:** `Android: Start Auto Reload`
**Terminal:** `.\auto-reload.bat` (from mobileApp/android directory)

Once started, just **save any Kotlin/XML file** and your changes will automatically appear on the emulator in seconds!

## 🚀 Manual Hot Reload Methods

### Method 1: VSCode Keyboard Shortcuts
- **Ctrl+Shift+A**: **Start automatic live reload** (NEW!)
- **Ctrl+Shift+R**: Full hot reload (build + install + launch)
- **Ctrl+Shift+B**: Build debug APK only
- **Ctrl+Shift+L**: Launch app on emulator

### Method 2: VSCode Command Palette
1. Press `Ctrl+Shift+P`
2. Type "Tasks: Run Task"
3. Select one of:
   - `Android: Start Auto Reload` (NEW!)
   - `Android: Start Auto Reload (Full Rebuild)` (NEW!)
   - `Android: Full Hot Reload`
   - `Android: Build Debug`
   - `Android: Install Debug`
   - `Android: Launch App`

### Method 3: Terminal Commands (From VSCode Terminal)
```powershell
# Navigate to android directory
cd mobileApp/android

# 🎯 NEW: Start automatic live reload (recommended)
.\auto-reload.bat

# Or with PowerShell directly
.\auto-reload.ps1

# Traditional one-time hot reload
.\hot-reload.bat

# Or use PowerShell script
.\hot-reload.ps1
```

### Method 4: Manual Commands
```powershell
# Set Java Home
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Build and install
.\gradle-8.2\bin\gradle.bat :app:assembleDebug
.\gradle-8.2\bin\gradle.bat :app:installDebug

# Launch app
& "C:\Users\sayalew\AppData\Local\Android\Sdk\platform-tools\adb.exe" shell monkey -p com.onlycoffee.app.debug -c android.intent.category.LAUNCHER 1
```

## ⚡ Development Workflow

### **🎯 With Auto-Reload (Recommended):**
1. **Start auto-reload** (`Ctrl+Shift+A` or `.\auto-reload.bat`)
2. **Make changes** to your Kotlin/Compose code
3. **Save files** (Ctrl+S) - **That's it!**
4. **See changes** automatically on the emulator in seconds!

### **🔄 With Manual Hot Reload:**
1. **Make changes** to your Kotlin/Compose code
2. **Save files** (Ctrl+S)
3. **Hot reload** using `Ctrl+Shift+R` or `.\hot-reload.bat`
4. **See changes** on the emulator!

## 🎯 What's Enabled

- ✅ **Automatic file watching** - detects changes instantly
- ✅ **Smart debouncing** - waits for you to finish editing
- ✅ **Debug build optimizations** for faster compilation
- ✅ **Live Edit support** for Jetpack Compose
- ✅ **Instant deployment** to emulator
- ✅ **Automatic app launch** after installation
- ✅ **VSCode integration** with tasks and shortcuts
- ✅ **Background processing** - doesn't block your editor

## 📱 Requirements

- Android emulator running
- VSCode with Kotlin extension
- Java/Android Studio JBR configured
- ADB in system PATH

## 🔧 Troubleshooting

**Build fails?**
- Check that emulator is running
- Verify Java Home path in scripts
- Clean build: `.\gradle-8.2\bin\gradle.bat clean`

**App doesn't launch?**
- Check ADB path in scripts
- Verify emulator is connected: `adb devices`
- Manually launch from emulator

**VSCode shortcuts not working?**
- Reload VSCode window
- Check `.vscode/keybindings.json` exists
- Use Command Palette as fallback

## 🎉 Tips for Faster Development

1. **Use Auto-Reload** (`Ctrl+Shift+A`) - set it and forget it!
2. **Keep emulator running** - don't close it between sessions
3. **Save frequently** - auto-reload will handle the rest
4. **Use Compose Previews** in Android Studio for UI-only changes
5. **Watch the terminal** - auto-reload shows build progress
6. **Use `Ctrl+Shift+R`** for manual reloads when needed
7. **Start with `-FullRebuild`** if you encounter caching issues

---

**Happy coding! ☕** Your changes should now appear in seconds, not minutes!
