# Control de despeses — Document del projecte

> Aquest document és la font de veritat sobre els objectius, l'stack i les regles de treball d'aquest projecte. **S'ha d'anar actualitzant a mesura que el projecte avança o canvia de direcció** (noves decisions, canvis d'stack, nous requisits, etc.). Abans de començar a treballar, llegeix-lo sencer.

## Objectiu de l'aplicació

Aplicació web per controlar les despeses de la llar:

- Introduir despeses de forma **molt ràpida** (ús freqüent, també des de mòbil/tablet just després de fer una compra).
- Organitzar les despeses per **categories i subcategories**.
- Crear i gestionar un **pressupost anual** per categoria/subcategoria i mes.
- Comparar pressupost amb despesa real i veure **desviacions**.
- Tenir un **dashboard** amb targetes resum i gràfics.

## Stack tècnic

| Peça | Tecnologia |
|---|---|
| Backend | Laravel (última versió estable) + Inertia.js |
| Frontend | Vue 3 |
| CSS | Bootstrap |
| Base de dades | SQLite |
| Icones | lucide-vue-next |
| Bundler | Vite |
| Tests backend | Pest PHP (`tests/Feature/`, `tests/Unit/`) |
| Tests frontend | Vitest (`resources/js/__tests__/`) |
| Tests — BD | SQLite en memòria |

## Requisit important: responsive

L'aplicació s'ha de veure i funcionar molt bé en **tablet i mòbil** (és des d'on probablement s'introduiran més dades), però també bé en **desktop**. Els formularis d'entrada de despeses han de tenir botons/camps prou grans per ús tàctil.

## Categories i subcategories (punt de partida)

Han de ser **gestionables des de l'aplicació** (no fixes al codi), ja que en el futur es poden afegir o modificar.

| Categoria | Exemples de subcategories |
|---|---|
| Subministres | Electricitat, Aigua, Gas |
| Menjar | Supermercats (Bon Preu, Mercadona, etc.) |
| Crèdits | Hipoteca, Crèdit cotxe |
| Impostos | Escombraries, Impost de circulació |
| Assegurances | Cotxe, Llar |
| Salut | Farmàcia |
| Subscripcions | Netflix, etc. |
| Transport | Gasolina, Pàrquing públic |
| Oci | Cinema, teatre |
| Lucki (mascota) | Veterinari, menjar |
| Compres | Electrodomèstics, etc. |

## Funcionalitats principals

1. **CRUD de despeses**: import, data, categoria, subcategoria, nota opcional. Formulari ràpid.
2. **Gestió de categories i subcategories**: crear/editar/eliminar.
3. **Pressupost anual**: import previst per categoria/subcategoria i mes (o per any, a decidir).
4. **Comparativa pressupost vs. real**: desviacions per mes i per any.
5. **Dashboard**:
   - Targetes resum: total mes, total any, desviació respecte al pressupost.
   - Gràfic de despeses per categoria.
   - Gràfic de despeses per subcategoria.
   - Vista mensual i vista anual.

## Convencions de codi (obligatòries)

- Variables/funcions/mètodes en **anglès**, `camelCase`.
- Classes i components Vue en `PascalCase`.
- Constants Laravel en `SCREAMING_SNAKE_CASE`.
- Prefixos: `is...`/`has...` per booleans, `...List`/`...Array` per col·leccions, `get...` per computed, `...Data` per dades del servidor.
- **Form Requests** per a tota validació — mai `$request->validate()` inline.
- Rutes públiques separades del panell d'administració (si aplica).
- Opcions dinàmiques/configuració carregades via Inertia shared data.

## Regles de treball

- **Desenvolupament incremental, fase a fase**. No avançar de fase sense confirmació explícita de l'usuari.
- **No implementar res sense aprovació prèvia** si hi ha dubtes o alternatives — preguntar primer.
- Cada canvi de codi ha d'anar acompanyat de **tests de verificació** (Pest backend / Vitest frontend), i cal confirmar que passen.
- L'usuari és programador **junior**: cal explicar el "per què" de les decisions, no només el "com". Anar pas a pas.
- Idioma de la interfície d'usuari: **sempre en català**.
- Preferència per fitxers complets, no fragments de codi solts.

## Full de ruta de fases (proposta)

1. Models i migracions (categories, subcategories, despeses, pressupostos).
2. CRUD de despeses.
3. Gestió de categories/subcategories.
4. Pressupost anual.
5. Dashboard i gràfics.

## Estat actual

- ✅ Fase 0 — Instal·lació base: Laravel 13 + Inertia + Vue 3 + Bootstrap + lucide-vue-next + Pest + Vitest, tot configurat i verificat (build, tests backend i frontend passant).
- ⏳ Pendent: proposta d'estructura de base de dades (taules/camps/relacions) per a despeses, categories, subcategories i pressupostos — **esperant aprovació de l'usuari** abans de crear migracions.

## Registre de decisions

| Data | Decisió |
|---|---|
| 2026-09-11 | Instal·lació inicial del projecte amb l'stack acordat. Substitució de Tailwind (per defecte a l'esquelet de Laravel) per Bootstrap, segons especificació. Substitució de PHPUnit per Pest. |
