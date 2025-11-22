use actix_web::{test, web, App};
use reconciliation_backend::handlers::health::health_check;

#[tokio::test]
async fn test_health_check() {
    let app = test::init_service(
        App::new().route("/health", web::get().to(health_check))
    ).await;
    let req = test::TestRequest::get().uri("/health").to_request();
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}
