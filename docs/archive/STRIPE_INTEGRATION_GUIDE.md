# 💳 Stripe Integration Guide

## Quick Setup

### 1. Get Stripe API Keys

1. Go to https://dashboard.stripe.com
2. Navigate to Developers → API keys
3. Copy your keys:
   - **Publishable key**: `pk_test_...` (public)
   - **Secret key**: `sk_test_...` (keep secret!)

### 2. Add to Environment

Edit `.env` file:
```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Configure Webhook

1. In Stripe Dashboard: Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/v1/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy Webhook Signing Secret → Add to `.env`

### 4. Test Integration

```bash
# Test with script
bash scripts/test_stripe_integration.sh

# Or manually with curl
curl -X POST http://localhost:2000/api/v1/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{"tier": "starter", "billingCycle": "monthly"}'
```

---

## Test Cards

Use these Stripe test cards:

### Successful Payment
- **Card**: `4242 4242 4242 4242`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

### Payment Failure
- **Card**: `4000 0000 0000 0002`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

---

## Payment Flow

1. **User clicks "Upgrade"** → Frontend calls checkout endpoint
2. **Backend creates Stripe session** → Returns checkout URL
3. **User completes payment** → Stripe redirects to success URL
4. **Stripe sends webhook** → Backend updates subscription
5. **User has access** → Based on subscription tier

---

## Monitoring

### Stripe Dashboard
- View payments: https://dashboard.stripe.com/payments
- View subscriptions: https://dashboard.stripe.com/subscriptions
- View logs: https://dashboard.stripe.com/logs

### Application Logs
```bash
# Check backend logs
docker-compose logs -f backend | grep stripe

# Search for errors
docker-compose logs backend | grep ERROR
```

---

## Troubleshooting

### Issue: "Invalid API Key"
**Solution**: Check that STRIPE_SECRET_KEY is set correctly in `.env`

### Issue: Webhook Not Received
**Solution**: 
1. Check webhook endpoint is publicly accessible
2. Verify webhook secret matches
3. Check Stripe logs for delivery attempts

### Issue: Payment Succeeded But No Access
**Solution**: 
1. Check webhook handling logic
2. Verify subscription update query
3. Check database for subscription record

---

**Status**: ✅ Ready for production use

