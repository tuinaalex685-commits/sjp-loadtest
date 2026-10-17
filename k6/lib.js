// Outils communs : classement des réponses par code HTTP et détection d'un blocage Vercel.
import { Counter } from 'k6/metrics';

export const BASE = 'https://tuina-ai.vercel.app';

const s2xx = new Counter('statut_2xx');
const s3xx = new Counter('statut_3xx');
const s403 = new Counter('statut_403');
const s429 = new Counter('statut_429');
const s4xx = new Counter('statut_4xx_autre');
const s5xx = new Counter('statut_5xx');
const s0 = new Counter('statut_0_reseau_ou_timeout');
const bloqueVercel = new Counter('vercel_pare_feu');

let logs = 0;
export function classer(r, label) {
  const s = r.status;
  if (s === 0) s0.add(1);
  else if (s < 300) s2xx.add(1);
  else if (s < 400) s3xx.add(1);
  else if (s === 403) s403.add(1);
  else if (s === 429) s429.add(1);
  else if (s < 500) s4xx.add(1);
  else s5xx.add(1);
  if (r.headers && (r.headers['X-Vercel-Mitigated'] || r.headers['x-vercel-mitigated'])) bloqueVercel.add(1);
  if (s !== 200 && logs < 15) {
    logs++;
    console.log(`[${label}] HTTP ${s} ${r.error || ''} ${String(r.body || '').slice(0, 150).replace(/\s+/g, ' ')}`);
  }
}
