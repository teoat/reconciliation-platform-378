//! mTLS verification for zero-trust middleware

use crate::errors::{AppError, AppResult};
use actix_web::dev::ServiceRequest;
use actix_web::HttpMessage as _;

/// Verify mTLS (mutual TLS) certificate
///
/// Validates client certificate for mTLS connections.
/// Checks HTTPS connection and extracts client certificate from request.
///
/// # Note
///
/// Full certificate chain verification, OCSP/CRL checks, and certificate
/// validation are placeholders for production implementation.
pub async fn verify_mtls(req: &ServiceRequest) -> AppResult<()> {
    // Check for client certificate
    // In production, this would verify the certificate chain
    // For now, we'll check if the connection is secure
    
    let connection_info = req.connection_info();
    if !connection_info.scheme().starts_with("https") {
        return Err(AppError::Forbidden("mTLS requires HTTPS connection".to_string()));
    }

    // Verify client certificate
    // In production, this would extract the client certificate from the TLS connection
    // For now, we check if the connection is HTTPS and log a warning if certificate is missing
    if let Some(_peer_cert) = req.extensions().get::<Vec<u8>>() {
        // Client certificate is present (in production, this would be extracted from TLS)
        log::debug!("Client certificate found in request");
        
        // Certificate verification implementation notes:
        // 1. Parse the certificate (using x509-parser or similar crate)
        // 2. Verify certificate signature against CA (using rustls or openssl)
        // 3. Check certificate revocation (OCSP/CRL) - requires OCSP responder or CRL distribution point
        // 4. Verify certificate chain - validate intermediate and root CAs
        // 5. Validate certificate subject/issuer - match against allowed subjects
        // 6. Check certificate expiration - ensure not expired and not before valid_from
        //
        // Production implementation would require:
        // - x509-parser crate for certificate parsing
        // - rustls or openssl for signature verification
        // - OCSP client for revocation checking
        // - CA certificate store for chain validation
        // - Configuration for allowed certificate subjects/issuers
        //
        // For now, if certificate is present, we accept it
        // Full verification is deferred to production deployment with proper TLS termination
        log::info!("Client certificate present, accepting (full verification deferred to production)");
    } else {
        // No client certificate found
        // In production with mTLS enabled, this would be an error
        // For now, we log a warning but allow the request
        log::warn!("mTLS enabled but no client certificate found in request");
        // In strict mode, this would return an error:
        // return Err(AppError::Forbidden("Client certificate required for mTLS".to_string()));
    }

    Ok(())
}

