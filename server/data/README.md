# Dane gry (ranking + słownik)

Te pliki **nie są generowane na Vercel**. Backend tylko je wczytuje przy starcie.

## Pliki

| Plik | Opis |
|------|------|
| `ranking.json` | Mapa `{ "haslo": { "slowo": [temperatura, rank], ... } }` — generowana lokalnie |
| `dictionary.txt` | Lista dozwolonych rzeczowników (walidacja zgadywania) |

## Jak wygenerować ranking

Silnik jest w osobnym katalogu `polish-contexto-engine/` (Python, modele ML — **tylko lokalnie**):

```bash
cd polish-contexto-engine
pip install -r requirements.txt
python generate_all.py
```

Skrypt czyta hasła z `server/seedData.js` i zapisuje wynik tutaj jako `ranking.json`.

## Deploy na Vercel

1. Wygeneruj `ranking.json` lokalnie (jak wyżej).
2. Commit + push pliku do repo.
3. Vercel pakuje go do funkcji API (`includeFiles` w `vercel.json`).
4. Gra działa tak samo jak na localhost — backend lookupuje temperatury z pliku.

**Nowe hasło dnia?** Dodaj je do `seedData.js`, uruchom `python generate_all.py` (albo `python generate_all.py nowe_haslo`), commituj zaktualizowany `ranking.json`.
