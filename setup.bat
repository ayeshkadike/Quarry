@echo off
REM Setup script for Local RAG Desktop on Windows

echo ================================================
echo Local RAG Desktop - Setup Script
echo ================================================
echo.

REM Check for Rust
where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Rust is not installed!
    echo Please install from: https://rustup.rs
    pause
    exit /b 1
)
echo [OK] Rust found: 
cargo --version

REM Check for Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install from: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found: 
node --version

REM Check for pnpm
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] pnpm not found, installing...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install pnpm
        pause
        exit /b 1
    )
)
echo [OK] pnpm found: 
pnpm --version

echo.
echo ================================================
echo Step 1: Building Rust workspace...
echo ================================================
cargo build
if %errorlevel% neq 0 (
    echo [ERROR] Rust build failed
    pause
    exit /b 1
)

echo.
echo ================================================
echo Step 2: Installing frontend dependencies...
echo ================================================
cd apps\desktop
pnpm install
if %errorlevel% neq 0 (
    echo [ERROR] pnpm install failed
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo.
echo ================================================
echo Step 3: Running tests...
echo ================================================
cargo test --workspace --lib
if %errorlevel% neq 0 (
    echo [WARN] Some tests failed, but continuing...
)

echo.
echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo To run the desktop app:
echo   cd apps\desktop
echo   pnpm tauri dev
echo.
echo Or use the Makefile (if you have make installed):
echo   make desktop
echo.
echo See SETUP_GUIDE.md for detailed instructions.
echo.
pause
