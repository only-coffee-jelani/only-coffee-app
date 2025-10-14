# 🔥 Auto Hot Reload for Only Coffee Android App

## 🎯 **What is Auto Hot Reload?**

Auto Hot Reload automatically watches your Kotlin and XML files for changes and rebuilds/deploys your app to the emulator whenever you save a file. No more manual building!

## 🚀 **Quick Start**

### **Option 1: VSCode (Recommended)**
1. Press `Ctrl+Shift+A` 
2. Start coding - changes appear automatically when you save!

### **Option 2: Command Line**
```bash
cd mobileApp/android
.\auto-reload.bat
```

## ⚡ **How It Works**

1. **File Watcher**: Monitors `.kt`, `.xml`, `.kts`, `.json` files
2. **Smart Debouncing**: Waits 2 seconds after your last change
3. **Auto Build**: Runs `gradle :app:assembleDebug`
4. **Auto Install**: Runs `gradle :app:installDebug`  
5. **Auto Launch**: Starts the app on your emulator
6. **Repeat**: Watches for the next change!

## 📁 **Watched Directories**

- `app/src/main/java` - All Kotlin source files
- `app/src/main/res` - All resource files (layouts, strings, etc.)
- `app/src/main/AndroidManifest.xml` - App manifest
- `app/build.gradle.kts` - App build configuration
- `build.gradle.kts` - Project build configuration

## 🎛️ **Command Options**

```powershell
# Basic auto-reload
.\auto-reload.ps1

# With full rebuild first (clears caches)
.\auto-reload.ps1 -FullRebuild

# With verbose output (shows all file changes)
.\auto-reload.ps1 -Verbose

# Custom debounce delay (default: 2000ms)
.\auto-reload.ps1 -DebounceMs 3000
```

## 🔧 **Prerequisites**

- ✅ Android emulator running
- ✅ Java Home set to Android Studio JBR
- ✅ ADB accessible
- ✅ Gradle wrapper configured

## 🛑 **Stopping Auto-Reload**

Press `Ctrl+C` in the terminal where auto-reload is running.

## 🎉 **Benefits**

- **⚡ Instant feedback** - see changes in 3-5 seconds
- **🤖 Fully automatic** - just save and watch
- **🧠 Smart** - ignores temporary files and build outputs
- **📊 Informative** - shows build progress and timing
- **🔄 Reliable** - handles build failures gracefully

---

**Happy coding! Your Android development just got 10x faster! ☕🚀**
