pub mod models;
pub mod service;

use anyhow::{Context, Result};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::str::FromStr;

pub struct Db {
    pub pool: SqlitePool,
}

impl Db {
    /// Connect to SQLite database (creates if doesn't exist)
    pub async fn connect(path: &str) -> Result<Self> {
        let options = SqliteConnectOptions::from_str(path)?
            .create_if_missing(true)
            .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal);

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(options)
            .await
            .context("Failed to connect to SQLite database")?;

        Ok(Self { pool })
    }

    /// Run migrations
    pub async fn migrate(&self) -> Result<()> {
        sqlx::migrate!("../../migrations/sqlite")
            .run(&self.pool)
            .await
            .context("Failed to run migrations")?;
        Ok(())
    }

    /// Get a reference to the connection pool
    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_db_connect() -> Result<()> {
        let db = Db::connect(":memory:").await?;
        assert!(db.pool.size() > 0);
        Ok(())
    }
}
