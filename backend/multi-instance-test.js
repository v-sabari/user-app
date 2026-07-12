import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp to 100 users
    { duration: '3m', target: 200 },   // Ramp to 200 users (2x single instance)
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<100'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  // Hit backend through Render's load balancer
  const res = http.get('https://day4-backend-lhwf.onrender.com/api/health');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(0.5);
}