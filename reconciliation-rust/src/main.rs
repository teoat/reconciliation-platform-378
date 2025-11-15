
use reconciliation_rust::test_server::run_test_server;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    run_test_server().await
}
