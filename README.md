# arCO₂ — Demo Modulo 1 Privati

Demo funzionante del Modulo 1 (Primo contatto e orientamento iniziale) della piattaforma arCO₂ per TicinoEnergia.

## Stack tecnico

| Layer | Tecnologie |
|-------|-----------|
| Frontend | React 18 + Vite 5 + TypeScript + React Router v6 |
| Backend | Node.js + Hono v4 + TypeScript |
| Dati | In-memory (demo) — pronto per Postgres/SQLite in produzione |

## Avvio rapido

### 1. Backend (porta 3001)

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (porta 5173)

```bash
cd frontend
npm install
npm run dev
```

Apri http://localhost:5173

## Flusso utente dimostrabile

```
Landing page
    ↓  "Scopri i percorsi per il tuo edificio"
Questionario (6 step)
    ↓  risponde alle 6 domande
Anteprima risultati (preview parziale + lock)
    ↓  "Crea account gratuito"
Registrazione
    ↓  account creato, dati questionario collegati
Dashboard
    ├── Panoramica (stats, percorso principale, prossimi passi)
    ├── Dossier edificio (dati + completamento)
    ├── Percorsi (5 percorsi con dettagli espandibili)
    ├── Consulente arCO₂ assegnato
    └── Documenti
```

## API endpoints

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/questionnaire | Submit questionario → algoritmo percorsi |
| POST | /api/register | Crea account (con dati questionario) |
| POST | /api/login | Login utente esistente |
| GET | /api/dashboard | Dashboard dati (richiede Bearer token) |

## Algoritmo di raccomandazione

Il backend implementa un motore di scoring che, basandosi sulle 6 risposte del questionario, calcola uno score per 5 possibili percorsi:

1. **Risanamento involucro** (isolamento + infissi)
2. **Sostituzione riscaldamento** (pompa di calore)
3. **Fotovoltaico + accumulo**
4. **Ventilazione meccanica controllata**
5. **Certificazione energetica CECE**

I percorsi vengono ordinati per score e etichettati come: *Fortemente consigliato*, *Consigliato*, *Da valutare*, *Opzionale*.

## Note per la presentazione

- La demo usa **storage in-memory** — i dati si resettano al riavvio del server
- Il proxy Vite (`/api → localhost:3001`) evita problemi CORS in sviluppo
- Il TypeScript compila senza errori su entrambi i progetti
- 3 consulenti arCO₂ mockati, assegnati round-robin alla registrazione

---
*Demo sviluppata da WellD per la RFP arCO₂ · TicinoEnergia · Aprile 2026*
