# Tauri Desktop App Setup

The Tauri desktop app needs to be initialized separately. Follow these steps:

## Prerequisites

1. Install Node.js 18+ and pnpm:
   ```bash
   npm install -g pnpm
   ```

2. Install Tauri prerequisites:
   - Windows: Install WebView2 (usually pre-installed on Windows 11)
   - See: https://tauri.app/v1/guides/getting-started/prerequisites

## Initialize the Tauri App

From the repository root:

```bash
cd apps
pnpm create tauri-app desktop
```

When prompted, choose:
- Package name: `desktop`
- Window title: `Local RAG`
- UI recipe: `React` with `TypeScript`
- Add `@tauri-apps/api`: Yes
- Add `@tauri-apps/cli`: Yes

## Install Dependencies

```bash
cd desktop
pnpm install
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p
```

## Replace Generated Files

After initialization, replace the following files with the ones in this directory:

- `src-tauri/src/main.rs` → Copy from `apps/desktop/src-tauri/main.rs`
- `src-tauri/src/commands.rs` → Copy from `apps/desktop/src-tauri/commands.rs`
- `src-tauri/Cargo.toml` → Update dependencies
- `src/App.tsx` → Copy from `apps/desktop/src/App.tsx`
- `tailwind.config.js` → Configure paths
- `src/index.css` → Add Tailwind directives

## Update Cargo.toml

Add these dependencies to `apps/desktop/src-tauri/Cargo.toml`:

```toml
[dependencies]
core = { path = "../../../crates/core" }
ingest = { path = "../../../crates/ingest" }
storage = { path = "../../../crates/storage" }
uuid = { workspace = true }
tokio = { workspace = true }
serde = { workspace = true }
serde_json = { workspace = true }
anyhow = { workspace = true }
tracing = { workspace = true }
```

## Run Development Server

```bash
pnpm tauri dev
```

Or from repository root:

```bash
make desktop
```
