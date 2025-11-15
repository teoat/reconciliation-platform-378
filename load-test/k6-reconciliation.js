import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 50,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:2000/api';

export default function () {
  const res = http.get(`${BASE_URL}/analytics/dashboard`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}


