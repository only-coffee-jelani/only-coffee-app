# Only Coffee - Dependency Setup

## Quick Setup (Automated)

Run the automated setup script:

```bash
./setup-dependencies.sh
```

This script will:
1. Check and install Homebrew (if needed)
2. Check and install Node.js 20+ (if needed)
3. Install Docker Desktop (if needed)
4. Install all backend npm packages
5. Verify Xcode installation

---

## Manual Setup

If you prefer to install dependencies manually:

### 1. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js 20 LTS

```bash
brew install node@20
```

Verify installation:
```bash
node --version  # Should show v20.x.x or higher
npm --version
```

### 3. Install Docker Desktop

**Option A: Via Homebrew (Recommended)**
```bash
brew install --cask docker
```

**Option B: Manual Download**
1. Visit: https://www.docker.com/products/docker-desktop
2. Download Docker Desktop for Mac (Apple Silicon or Intel)
3. Install the .dmg file
4. Launch Docker Desktop from Applications

**After Installation:**
1. Open Docker Desktop
2. Wait for it to start (you'll see the Docker icon in the menu bar)
3. Verify it's running:
```bash
docker --version
docker ps
```

### 4. Install Xcode (For iOS Development)

**From Mac App Store:**
1. Open App Store
2. Search for "Xcode"
3. Click "Get" or "Download"
4. Wait for installation (8+ GB)

**Or via command line:**
```bash
xcode-select --install
```

Verify installation:
```bash
xcodebuild -version
```

### 5. Install Project Dependencies

```bash
# Navigate to project
cd only-coffee-app-repo

# Install backend dependencies
cd backend
npm install --legacy-peer-deps

# Install gateway dependencies
cd services/gateway
npm install --legacy-peer-deps

# Return to project root
cd ../../..
```

---

## Troubleshooting

### "docker: command not found"

**Solution 1:** Docker Desktop isn't installed
- Install Docker Desktop using one of the methods above

**Solution 2:** Docker Desktop isn't running
- Open Docker Desktop from Applications
- Wait for it to fully start (Docker icon appears in menu bar)

**Solution 3:** Shell needs to reload
```bash
# Restart your terminal or run:
source ~/.zshrc  # or ~/.bashrc
```

### "docker compose: command not found"

Modern Docker Desktop includes Docker Compose by default. Try:

```bash
# Use space instead of hyphen
docker compose version

# If that works, update scripts to use "docker compose" instead of "docker-compose"
```

**If neither works:**
```bash
brew install docker-compose
```

### "npm: command not found"

Node.js isn't installed or not in PATH:

```bash
# Install Node.js
brew install node@20

# Add to PATH (add to ~/.zshrc or ~/.bashrc)
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Reload shell
source ~/.zshrc
```

### "Permission denied" errors

Make scripts executable:
```bash
chmod +x setup-dependencies.sh
chmod +x start-all.sh
chmod +x start-backend.sh
chmod +x start-ios.sh
chmod +x stop-all.sh
```

### "Port already in use" errors

**For PostgreSQL (port 5432):**
```bash
lsof -i :5432
kill -9 <PID>
```

**For Redis (port 6379):**
```bash
lsof -i :6379
kill -9 <PID>
```

**For Backend (port 3000):**
```bash
lsof -i :3000
kill -9 <PID>
```

### Xcode signing issues

1. Open Xcode
2. Go to Xcode > Settings > Accounts
3. Add your Apple ID
4. In project settings, select your Team under Signing & Capabilities

---

## Verify Installation

Run these commands to verify everything is installed:

```bash
# Homebrew
brew --version

# Node.js
node --version  # Should be v20+
npm --version

# Docker
docker --version
docker compose version
docker ps  # Should show no errors

# Xcode
xcodebuild -version  # Should show Xcode 15+
```

---

## What Each Tool Does

| Tool | Purpose | Required For |
|------|---------|--------------|
| **Homebrew** | Package manager for macOS | Installing other tools |
| **Node.js** | JavaScript runtime | Running backend services |
| **npm** | Package manager | Installing dependencies |
| **Docker Desktop** | Container platform | PostgreSQL, Redis databases |
| **Xcode** | iOS development | Building iOS app |

---

## Next Steps

Once all dependencies are installed:

1. **Start the application:**
   ```bash
   ./start-all.sh
   ```

2. **Or start components individually:**
   ```bash
   # Backend only
   ./start-backend.sh

   # iOS only
   ./start-ios.sh
   ```

3. **Read the Quick Start Guide:**
   ```bash
   cat QUICK_START.md
   ```

---

## Still Having Issues?

1. Check that Docker Desktop is running (icon in menu bar)
2. Verify all installations with the commands in "Verify Installation" section
3. Try restarting your terminal
4. Try restarting Docker Desktop
5. Check the logs:
   ```bash
   # Docker logs
   docker logs only-coffee-postgres
   docker logs only-coffee-redis

   # Backend logs
   tail -f backend.log
   ```

---

**Need more help?** See QUICK_START.md for detailed usage instructions.
