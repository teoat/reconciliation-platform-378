pub mod reconciliation;
pub mod users;
pub mod auth; // Declare the new auth module

use actix_web::web;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(web::scope("/auth")
        .service(auth::register_user)
        .service(auth::login_user)
        .service(auth::login_with_recovery_code)
        .service(auth::refresh_token)
        .service(auth::google_oauth_login)
        .service(auth::google_oauth_callback)
        .service(auth::github_oauth_login)
        .service(auth::github_oauth_callback)
        .service(auth::generate_2fa_secret)
        .service(auth::verify_2fa_setup)
        .service(auth::enable_2fa)
        .service(auth::disable_2fa)
        .service(auth::generate_recovery_codes));
    cfg.service(web::scope("/users").configure(users::configure_routes));
    // TODO: Add reconciliation routes when implemented
    // cfg.service(web::scope("/reconciliation").configure(reconciliation::configure_routes));
}
