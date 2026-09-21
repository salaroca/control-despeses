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

## Mòdul futur: Receptari / Menús setmanals / Llista de compra (PRO)

Mòdul planificat per a **després** que el nucli de control de despeses estigui acabat i estable (dashboard, pressupost anual, desviacions, gràfiques per categoria/subcategoria).

**Decisió**: es construeix dins del mateix projecte (mateix Laravel + Bootstrap + Vue + Inertia + SQLite), però com un mòdul clarament separat (rutes, controllers i models propis).

- **Per què al mateix projecte i no a part**: comparteix infraestructura (Laravel, Bootstrap/Vue/Inertia, hosting, SQLite). Hi ha un punt de connexió real amb el control de despeses: la llista de compra setmanal i el control de preus per producte al súper (categoria "Menjar: Supers") són conceptualment la mateixa dada (producte, preu, súper, data). Si en el futur es vol que marcar un ingredient com a comprat generi automàticament la despesa a la categoria "Menjar", només té sentit si viu al mateix sistema. Aquesta connexió és **opcional**, no obligatòria: el mòdul ha de poder viure sense ella.
- **Per què separat i no barrejat amb la lògica de despeses**: és un domini diferent (contingut/receptes vs. finances) i no ha de bloquejar ni complicar el que ja funciona del control de despeses.

**Talls verticals independents** (cada pas és un lliurable complet i útil per si sol):

1. **Receptari bàsic**: ingredients, tipus de plat (primers, segons, postres), dietes de règim, ingredient principal o categoria (pasta, arròs, amanides, etc.). Útil per si sol com a llibre de receptes digital.
2. **Calendari de menús setmanal** (dilluns a diumenge): selecció de receptes ja existents del receptari per assignar-les als dies de la setmana. Només té sentit un cop hi ha receptes carregades (pas 1).
3. **Llista de compra automàtica**: generada agregant els ingredients de totes les receptes del menú de la setmana. Pas amb més valor pràctic (estalvia fer la llista a mà).
4. **(Opcional, futur) Enllaç llista de compra → despeses**: en marcar un producte com a comprat, oferir crear/pre-omplir una despesa a la categoria "Menjar".

**Ordre recomanat**: acabar primer el nucli de despeses (Fase 1: dashboard, pressupost anual, desviacions, gràfiques per categoria i subcategoria, control de preus per producte) abans de començar aquest mòdul, seguint el principi ja establert de desenvolupament incremental.

## Estat actual

- ✅ Fase 0 — Instal·lació base: Laravel 13 + Inertia + Vue 3 + Bootstrap + lucide-vue-next + Pest + Vitest, tot configurat i verificat (build, tests backend i frontend passant).
- ✅ Fase 1 — Models i migracions: taules `categories`, `subcategories`, `expenses`, `budgets` amb les seves relacions (`Category hasMany Subcategory`, `Subcategory belongsTo Category` + `hasMany Expense/Budget`, `Expense/Budget belongsTo Subcategory`). Pressupost **mensual per subcategoria** (`budgets`: `subcategory_id` + `year` + `month`, únic). Seeder `CategorySeeder` amb les 11 categories inicials i les seves subcategories. 14 tests Pest a `tests/Feature/Models/` i `tests/Feature/CategorySeederTest.php`, tots passant. Migracions aplicades a la BD de desenvolupament.
- ✅ Fase 2 — CRUD de despeses: pàgina única `/despeses` (arrel `/` hi redirigeix) amb formulari ràpid sempre visible (afegir) i llistat amb edició i esborrat inline, sense canviar de pantalla. `ExpenseController` (index/store/update/destroy) + `StoreExpenseRequest`/`UpdateExpenseRequest` per a la validació. Categories i subcategories es carreguen com a dada compartida d'Inertia (`categoriesList`, a `HandleInertiaRequests`) perquè estiguin disponibles a qualsevol pàgina futura. Component Vue reutilitzable `ExpenseForm` (selects encadenats categoria→subcategoria, camps grans per a ús tàctil) usat tant per crear com per editar. Llistat paginat (15 per pàgina) amb botons "Anterior"/"Següent" en català. 6 tests Pest nous a `tests/Feature/ExpenseControllerTest.php` i 11 tests Vitest nous (`ExpenseForm.spec.js`, `Index.spec.js`), tots passant. Provat també manualment contra el servidor real (crear, llistar i esborrar una despesa via curl). La pàgina `Welcome` inicial s'ha eliminat (substituïda per `/despeses` com a pàgina principal).
- ✅ Fase 3 — Gestió de categories i subcategories: pàgina `/categories` (mateix patró de la fase 2: formularis ràpids + llistat amb edició/esborrat inline). `CategoryController` i `SubcategoryController` (store/update/destroy) + `Store`/`UpdateCategoryRequest` i `Store`/`UpdateSubcategoryRequest` (noms únics: categoria única globalment, subcategoria única dins la seva categoria). Esborrar una categoria o subcategoria amb despeses associades es bloqueja (es captura la `QueryException` de la restricció de BD i es mostra un missatge en català). S'ha afegit `AppLayout.vue` amb una barra de navegació (Despeses / Categories), ara compartida per totes les pàgines. 12 tests Pest nous (`CategoryControllerTest.php`, `SubcategoryControllerTest.php`) i 8 tests Vitest nous (`Categories/Index.spec.js`, `Layouts/AppLayout.spec.js`), tots passant. Provat també manualment contra el servidor real (crear categoria/subcategoria i comprovar que no es pot esborrar una categoria amb despeses associades).
- ⏳ Pendent: Fase 4 — Pressupost anual (mensual per subcategoria).
- 📌 Planificat (no iniciat): mòdul Receptari / Menús setmanals / Llista de compra, un cop el nucli de despeses estigui acabat (vegeu secció anterior).

## Registre de decisions

| Data | Decisió |
|---|---|
| 2026-09-11 | Instal·lació inicial del projecte amb l'stack acordat. Substitució de Tailwind (per defecte a l'esquelet de Laravel) per Bootstrap, segons especificació. Substitució de PHPUnit per Pest. |
| 2026-09-19 | Planificació del mòdul futur Receptari / Menús setmanals / Llista de compra (PRO): es farà dins del mateix projecte com a mòdul separat, després d'acabar el nucli de control de despeses. |
| 2026-09-19 | Fase 1 (models i migracions) implementada. Pressupost confirmat com a **mensual per subcategoria** (no anual ni per categoria); els totals per categoria i any es calculen sumant, no es guarden per separat. |
| 2026-09-21 | Fase 2 (CRUD de despeses) implementada. Disseny confirmat amb l'usuari: una sola pàgina amb formulari ràpid + llistat amb edició/esborrat inline (millor per a mòbil que pàgines separades de crear/editar), i URLs de rutes en català (`/despeses`). |
| 2026-09-21 | Fase 3 (gestió de categories i subcategories) implementada, seguint el mateix patró de disseny aprovat a la fase 2 (pàgina única, edició inline). No es permet esborrar una categoria/subcategoria si té despeses associades (restricció de BD capturada i traduïda a un missatge d'error en català). |
