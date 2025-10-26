#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod state;

use state::AppState;
use std::sync::Arc;
use tauri::Manager;

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("info,desktop=debug")
        .init();

    tauri::Builder::default()
        .setup(|app| {
            // Initialize app state
            let app_state = Arc::new(AppState::new());
            app.manage(app_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_collection,
            commands::list_collections,
            commands::delete_collection,
            commands::ingest_paths,
            commands::search,
            commands::get_ingest_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
