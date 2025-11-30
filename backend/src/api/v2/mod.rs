pub mod dtos;
pub mod handlers;
pub mod models;

use actix_web::web;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(web::scope("/users").configure(handlers::users::configure_routes));
    // Add more resource scopes as needed
}
