/// Headless server mode (placeholder)
/// 
/// Future: REST API server for running the RAG engine without Tauri UI
/// Useful for:
/// - Server deployments
/// - CLI tools
/// - Integration with other frontends

pub struct Server;

impl Server {
    pub fn new() -> Self {
        Self
    }

    pub async fn run(&self) -> anyhow::Result<()> {
        anyhow::bail!("Headless server mode not yet implemented")
    }
}
