// Scénario 1 : 1000 visiteurs anonymes arrivent (accueil -> connexion -> inscription).
// Aucune écriture, aucun appel IA.
import http from 'k6/http';
import { sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE, classer } from './lib.js';

const tAccueil = new Trend('t_accueil', true);
const tLogin = new Trend('t_page_login', true);
const tInscription = new Trend('t_page_inscription', true);

export const options = {
  scenarios: {
    visiteurs: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 300 },
        { duration: '45s', target: 1000 },
        { duration: '60s', target: 1000 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

function get(path, trend) {
  const r = http.get(`${BASE}${path}`, { tags: { name: path }, timeout: '30s' });
  trend.add(r.timings.duration);
  classer(r, path);
}

export default function () {
  get('/', tAccueil);
  sleep(2 + Math.random() * 3);
  get('/login', tLogin);
  sleep(2 + Math.random() * 3);
  get('/inscription', tInscription);
  sleep(3 + Math.random() * 3);
}
