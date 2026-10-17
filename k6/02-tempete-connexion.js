// Scénario 2 : tempête de connexions, par paliers croissants (connexions par seconde).
// Emails inexistants : aucun compte réel touché, aucun appel IA.
// Chaque palier est un scénario distinct -> le résumé montre où ça casse.
// Arrêt automatique si plus de 40 % des connexions échouent (protection de la production).
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';
import exec from 'k6/execution';
import { BASE, classer } from './lib.js';

const LOGIN_ACTION = '60619b965a5db5fdfb475457921b494a3de4df03b0';
const tLogin = new Trend('t_login', true);
const loginOk = new Rate('login_ok');          // réponse applicative normale reçue
const inattendu = new Rate('login_inattendu'); // réponse 200 mais message anormal

const PALIERS = [5, 10, 20, 40, 80, 150];
const DUREE = 30;
const PAUSE = 10;

const scenarios = {};
const thresholds = {
  login_ok: [{ threshold: 'rate>0.6', abortOnFail: true, delayAbortEval: '20s' }],
};
PALIERS.forEach((rate, i) => {
  const nom = `p${String(rate).padStart(3, '0')}_par_s`;
  scenarios[nom] = {
    executor: 'constant-arrival-rate',
    rate, timeUnit: '1s', duration: `${DUREE}s`,
    startTime: `${i * (DUREE + PAUSE)}s`,
    preAllocatedVUs: Math.min(rate * 5, 600), maxVUs: 1500,
  };
  thresholds[`t_login{scenario:${nom}}`] = ['p(95)>=0'];
  thresholds[`login_ok{scenario:${nom}}`] = ['rate>=0'];
  thresholds[`http_reqs{scenario:${nom}}`] = ['count>=0'];
});

export const options = { scenarios, thresholds };

let logs = 0;
export default function () {
  const email = `k6-test-${exec.vu.idInTest}-${exec.vu.iterationInScenario}-${Date.now()}@example.invalid`;
  const r = http.post(`${BASE}/login`, JSON.stringify([email, 'MauvaisMotDePasse123']), {
    headers: { 'Next-Action': LOGIN_ACTION, 'Accept': 'text/x-component', 'Content-Type': 'text/plain;charset=UTF-8' },
    timeout: '60s',
    tags: { name: 'login' },
  });
  tLogin.add(r.timings.duration);
  classer(r, 'login');
  const normal = r.status === 200 && String(r.body).includes('Email ou mot de passe incorrect');
  loginOk.add(normal);
  if (r.status === 200) {
    inattendu.add(!normal);
    if (!normal && logs < 10) { logs++; console.log(`INATTENDU: ${String(r.body).slice(0, 200)}`); }
  }
}
