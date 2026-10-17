# sjp-loadtest

Tests de montée en charge k6 pour SJP (https://tuina-ai.vercel.app), lancés par GitHub Actions.
Chaque envoi qui modifie `run.txt` ou `k6/` lance les scénarios listés dans `run.txt` ;
les résultats sont renvoyés dans `results/`.
