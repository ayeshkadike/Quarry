#!/bin/bash

# Setup script for Local RAG Desktop on Unix-like systems

set -e

echo "================================================"
echo "Local RAG Desktop - Setup Script"
echo "================================================"
echo ""

# Check for Rust
if ! command -v cargo &> /dev/null; then
    echo "[ERROR] Rust is not installed!"
    echo "Please install from: https://rustup.rs"
    exit 1
fi
echo "[OK] Rust found: $(cargo --version)"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install from: https://nodejs.org"
    exit 1
fi
echo "[OK] Node.js found: $(node --version)"

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "[WARN] pnpm not found, installing..."
    npm install -g pnpm
fi
echo "[OK] pnpm found: $(pnpm --version)"

echo ""
echo "================================================"
echo "Step 1: Building Rust workspace..."
echo "================================================"
cargo build

echo ""
echo "================================================"
echo "Step 2: Installing frontend dependencies..."
echo "================================================"
cd apps/desktop
pnpm install
cd ../..

echo ""
echo "================================================"
echo "Step 3: Running tests..."
echo "================================================"
cargo test --workspace --lib || echo "[WARN] Some tests failed, but continuing..."

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "To run the desktop app:"
echo "  cd apps/desktop"
echo "  pnpm tauri dev"
echo ""
echo "Or use the Makefile:"
echo "  make desktop"
echo ""
echo "See SETUP_GUIDE.md for detailed instructions."
echo ""
