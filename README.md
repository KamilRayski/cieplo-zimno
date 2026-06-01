# Ciepło–Zimno

Gra słowna (React + Vite + Firebase + Express).

**Demo (frontend):** https://cieplozimno.vercel.app/login

## Uruchomienie lokalne

```bash
# Backend (port 4000)
cd server
npm install
npm run dev

# Frontend (port 5173)
cd app
npm install
cp .env.example .env
# uzupełnij .env kluczami z Firebase Console
npm run dev
```

## Firebase Authentication

W [Firebase Console](https://console.firebase.google.com):

1. **Authentication** → Get started  
2. **Sign-in method** → **Email/Password** → Enable  
3. **Sign-in method** → **Google** → Enable  
4. **Settings** → Authorized domains → `localhost` oraz `cieplozimno.vercel.app`

## Zmienne środowiskowe (`app/.env`)

| Zmienna | Opis |
|---------|------|
| `VITE_FIREBASE_*` | Konfiguracja web app z Firebase |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 (`G-...`) |
| `VITE_HOTJAR_SITE_ID` | Opcjonalnie: ID Hotjar (`@hotjar/browser`) |
| *(index.html)* | Contentsquare UXA — skrypt Hotjar z panelu |

## Struktura frontendu

- `app/src/pages/` — widoki (routing)  
- `app/src/components/` — komponenty wielokrotnego użytku  
- `app/src/auth/` — `AuthContext`, chronione trasy  
- `app/src/lib/firebase.ts` — `initializeApp`, `getAuth`, Firestore  

## Deploy (Vercel — frontend)

1. Import repozytorium na [vercel.com](https://vercel.com)  
2. **Root Directory:** `app`  
3. **Build Command:** `npm run build`  
4. **Output Directory:** `dist`  
5. Dodaj zmienne `VITE_*` w Settings → Environment Variables  
6. Backend (`server`) osobno np. [Railway](https://railway.com) — ustaw proxy API lub `VITE_API_URL` jeśli rozszerzysz projekt  

Plik `app/vercel.json` obsługuje SPA (React Router).

## Dokumentacja — screeny (uzupełnij przed oddaniem)

Wstaw zrzuty ekranu do folderu `docs/screenshots/`:

| Plik | Zawartość |
|------|-----------|
| `app-login.png` | Ekran logowania |
| `app-game.png` | Gra |
| `app-ranking.png` | Ranking |
| `ga-dashboard.png` | Google Analytics — raporty / realtime |
| `hotjar-recordings.png` | Hotjar — nagrania / heatmapy |

### Przykład w README (po dodaniu plików)

![Logowanie](docs/screenshots/app-login.png)  
![Google Analytics](docs/screenshots/ga-dashboard.png)  
![Hotjar](docs/screenshots/hotjar-recordings.png)

## Checklist projektu

- [x] React Router + trasy chronione + 404  
- [x] Folder `pages/`  
- [x] Komponenty w `components/`  
- [x] Stylowanie CSS  
- [x] Firebase Auth (Email/Password + Google)  
- [x] Hotjar (`@hotjar/browser`)  
- [x] Google Analytics (`react-ga4` + `AnalyticsListener`)  
- [x] Instrukcja deploy  
- [ ] Screeny w `docs/screenshots/` (do uzupełnienia przez zespół)

## Trasy

| Trasa | Opis |
|-------|------|
| `/login`, `/register` | Logowanie Firebase |
| `/game` | Gra |
| `/home`, `/ranking`, `/archive`, `/calendar`, `/friends`, `/settings`, `/info`, `/contact` | Pozostałe ekrany |
| `*` | 404 |
