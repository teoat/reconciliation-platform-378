use actix_web::{test, App};
use reconciliation_backend::handlers::health_check;

#[actix_rt::test]
async fn test_health_check() {
    let mut app = test::init_service(App::new().service(health_check)).await;
    let req = test::TestRequest::get().uri("/health").to_request();
    let resp = test::call_service(&mut app, req).await;
    assert!(resp.status().is_success());
}
