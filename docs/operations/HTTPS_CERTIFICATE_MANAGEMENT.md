# HTTPS and Certificate Management Guide

**Last Updated**: 2025-11-29  
**Status**: ACTIVE  
**Purpose**: Guide for HTTPS configuration and certificate management

---

## Overview

HTTPS (TLS/SSL) is required for all production deployments to encrypt data in transit and protect user privacy.

---

## Certificate Types

### Let's Encrypt (Recommended)

**Pros**:
- Free
- Automated renewal
- Widely trusted
- Easy to set up

**Cons**:
- 90-day validity (requires auto-renewal)
- Rate limits

### Commercial Certificates

**Pros**:
- Longer validity (1-3 years)
- Extended validation options
- Support included

**Cons**:
- Cost
- Manual renewal

---

## Certificate Management

### Let's Encrypt with Certbot

**Installation**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot

# macOS
brew install certbot
```

**Obtain Certificate**:
```bash
# Standalone mode
sudo certbot certonly --standalone -d api.example.com

# Webroot mode (if web server is running)
sudo certbot certonly --webroot -w /var/www/html -d api.example.com
```

**Auto-Renewal**:
```bash
# Test renewal
sudo certbot renew --dry-run

# Set up cron job
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

---

## Kubernetes Certificate Management

### Cert-Manager

**Installation**:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

**Certificate Issuer**:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

**Certificate Request**:
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: api-cert
  namespace: reconciliation-platform
spec:
  secretName: api-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - api.example.com
```

---

## Nginx Configuration

### SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/api.example.com/chain.pem;

    location / {
        proxy_pass http://backend:2000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Verification

### Check Certificate

```bash
# Check certificate details
openssl s_client -connect api.example.com:443 -servername api.example.com

# Check certificate expiration
echo | openssl s_client -servername api.example.com -connect api.example.com:443 2>/dev/null | openssl x509 -noout -dates

# Check certificate chain
openssl s_client -connect api.example.com:443 -showcerts
```

### Online Tools

- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)

---

## Certificate Renewal Monitoring

### Alerting

Set up alerts for:
- Certificate expiration (30 days before)
- Renewal failures
- Certificate validation errors

### Monitoring Script

```bash
#!/bin/bash
# Check certificate expiration

DOMAIN="api.example.com"
DAYS_BEFORE_EXPIRY=30

EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt $DAYS_BEFORE_EXPIRY ]; then
    echo "WARNING: Certificate expires in $DAYS_UNTIL_EXPIRY days"
    exit 1
else
    echo "Certificate valid for $DAYS_UNTIL_EXPIRY days"
    exit 0
fi
```

---

## Best Practices

1. **Use TLS 1.2+**: Disable older protocols
2. **Strong Ciphers**: Use modern cipher suites
3. **HSTS**: Enable with long max-age
4. **OCSP Stapling**: Improve performance
5. **Auto-Renewal**: Set up automated renewal
6. **Monitoring**: Monitor expiration dates
7. **Backup**: Keep certificate backups secure

---

## Troubleshooting

### Certificate Not Trusted

**Issue**: Browser shows certificate error

**Solutions**:
1. Check certificate chain is complete
2. Verify intermediate certificates
3. Check certificate is for correct domain
4. Verify certificate hasn't expired

### Renewal Failures

**Issue**: Certificate renewal fails

**Solutions**:
1. Check domain ownership
2. Verify DNS records
3. Check rate limits (Let's Encrypt)
4. Review renewal logs
5. Test renewal manually

---

## Related Documentation

- [Security Headers Verification](./SECURITY_HEADERS_VERIFICATION.md)
- [Deployment Runbook](../deployment/DEPLOYMENT_RUNBOOK.md)
- [Network Segmentation](./NETWORK_SEGMENTATION.md)

---

**Last Updated**: 2025-11-29  
**Maintained By**: DevOps Team

