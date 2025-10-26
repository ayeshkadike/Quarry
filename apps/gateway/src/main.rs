mod handlers;
mod middleware;
mod providers;

use axum::{routing::post, Router};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,gateway=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let app = Router::new()
        .route("/v1/search/web", post(handlers::web_search))
        .route("/v1/gen", post(handlers::gen_answer))
        .route("/health", axum::routing::get(|| async { "OK" }))
        .layer(CorsLayer::permissive())
        .layer(tower_http::trace::TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], 8787));
    tracing::info!("Gateway service starting on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
