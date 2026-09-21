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
| CSS / UI | Tabler (`@tabler/core`, MIT, basat en Bootstrap 5) |
| Base de dades | SQLite |
| Icones | `@tabler/icons-vue` |
| Bundler | Vite |
| Autenticació | Sessió de Laravel (`Auth`/guard `web`), sense registre públic — usuaris creats manualment amb `php artisan app:create-user` |
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

1. **CRUD de despeses**: import, data, categoria, subcategoria, banc (opcional), nota opcional. Formulari ràpid.
2. **Gestió de categories i subcategories**: crear/editar/eliminar.
3. **Gestió de bancs**: crear/editar/eliminar. Un banc és opcional a cada despesa (per exemple, pagaments en efectiu no en tenen); si s'elimina un banc, les despeses que el tenien assignat el perden però no s'esborren. Cada subcategoria també pot tenir un banc assignat (es gestiona a Categories, igual que el nom).
4. **Pressupost anual**: import previst per categoria/subcategoria i mes. El total per banc **no s'introdueix a mà**: es calcula sumant els pressupostos de les subcategories que tenen aquell banc assignat.
5. **Comparativa pressupost vs. real**: desviacions per mes i per any.
6. **Dashboard**:
   - Targetes resum: total mes, total any, desviació respecte al pressupost.
   - Gràfic de despeses per categoria.
   - Gràfic de despeses per subcategoria.
   - Gràfic de despeses per banc.
   - Gràfic de tendència de la desviació (pressupost − despesa real), amb selector de finestra 3/6/12 mesos.
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
- ✅ Fase 4 — Pressupost mensual per subcategoria: pàgina `/pressupostos` amb una graella (files = subcategories agrupades per categoria, columnes = els 12 mesos d'un any) i un selector d'any (any anterior/següent). Cada casella es desa automàticament en sortir-ne (`blur`), sense botó de "Desa" ni pàgines de crear/editar separades. `BudgetController` amb `index` (llista els pressupostos de l'any demanat) i `upsert` (`updateOrCreate`; si l'import queda buit, esborra el registre en lloc de desar-lo a 0). `StoreBudgetRequest` valida import ≥ 0, mes 1-12 i any. Abast acordat amb l'usuari: **només gestió del pressupost**, sense comparativa amb la despesa real (això queda per la fase 5, Dashboard, que és on el document ja preveu les targetes de desviació). Afegit "Pressupostos" al menú de navegació. 6 tests Pest nous (`BudgetControllerTest.php`) i 5 tests Vitest nous (`Pressupostos/Index.spec.js`), tots passant. Provat també manualment contra el servidor real (crear, actualitzar sense duplicar, i esborrar buidant la casella).
- ✅ Autenticació: totes les rutes de l'aplicació (`/despeses`, `/categories`, `/pressupostos`) protegides amb el middleware `auth` de Laravel; sense sessió redirigeix a `/login`. Sense registre públic — els usuaris es creen manualment amb `php artisan app:create-user {nom} {email}` (demana la contrasenya de forma oculta per terminal, no per xat). `AuthenticatedSessionController` (login/logout) + `LoginRequest`. Botó "Surt" al menú de navegació. 6 tests Pest nous (`Auth/AuthenticationTest.php`).
- ✅ Disseny: substitució de Bootstrap "net" per **Tabler** (`@tabler/core`, MIT, basat en Bootstrap 5 — s'ha pogut integrar directament sense refer els formularis, ja que Tabler reutilitza les mateixes classes de Bootstrap per a `form-control`, `form-select`, `card`, etc.) i de `lucide-vue-next` per `@tabler/icons-vue`, aplicat a totes les pàgines existents (Despeses, Categories, Pressupostos) i a la nova pàgina de login, amb l'esquelet oficial de Tabler (`page`, `navbar`, `page-header`, `page-body`). Decisions preses amb l'usuari: aplicar-ho a tota l'app de cop (no deixar dos estils barrejats) i canviar també les icones per coherència visual.
- ✅ Fase 5 — Dashboard i gràfics: pàgina `/dashboard` amb un selector de mes/any i, **alhora** (sense commutador), les targetes resum del mes seleccionat i de l'any seleccionat (gastat, pressupostat, desviació) — la desviació es mostra en verd/vermell amb una icona de tendència (mai només amb color). Dos gràfics de barres horitzontals (Chart.js + vue-chartjs), un per despesa per categoria i un per subcategoria, **del mes seleccionat**; s'ha triat barres en lloc de donut seguint les bones pràctiques de visualització (comparar magnituds es llegeix millor amb barres que amb cercles, i evita el límit de colors categòrics quan hi ha moltes subcategories). `DashboardController` calcula els totals i desglossos amb consultes a `expenses`/`budgets`. 6 tests Pest nous (`DashboardControllerTest.php`) i 8 tests Vitest nous (`StatCard`, `ExpenseBreakdownChart`, `Dashboard/Index`), tots passant. Provat també manualment contra el servidor real. Amb això es tanca el nucli de control de despeses previst a `PROJECTE.md`.
- ✅ Polish visual: favicon propi (`public/favicon.svg` + `favicon.ico` de reserva, generat amb GD ja que no hi havia cap eina de conversió d'imatges disponible), pàgines d'error 404/500 amb l'estil de Tabler (`resources/views/errors/`, patró "empty state") en lloc de les d'ambit per defecte de Laravel, i mode fosc (commutador ☀️/🌙 al menú, mecanisme `data-bs-theme` de Bootstrap/Tabler, preferència desada a `localStorage` i aplicada abans de pintar la pàgina per evitar parpelleig).
- ✅ Bancs: nova entitat `Bank` (nom únic), gestionable des de `/bancs` amb el mateix patró de pàgina única + edició inline. Camp `bank_id` **opcional** a les despeses (formulari, llistat, `ExpenseForm`). A diferència de categoria/subcategoria, esborrar un banc **no** bloqueja ni esborra les despeses que el tenien assignat — simplement el deixen d'apuntar (`nullOnDelete` a la migració), perquè un banc és una dada secundària/opcional, no l'estructura organitzativa principal. Afegit un tercer gràfic al Dashboard ("Despesa per banc", del mes seleccionat); les despeses sense banc es mostren agrupades com "Sense banc" perquè el gràfic quadri amb el total del mes. 10 tests Pest nous (`BankControllerTest.php` + ampliacions a `ExpenseControllerTest.php`/`DashboardControllerTest.php`) i 6 tests Vitest nous (`Bancs/Index.spec.js` + ampliacions a `ExpenseForm`/`Despeses/Index`/`Dashboard/Index`), tots passant. Provat també manualment contra el servidor real (crear banc, assignar-lo a una despesa, veure'l al dashboard, esborrar-lo i comprovar que la despesa es manté sense banc).
- ✅ Total de pressupost per banc: **no** és un pressupost introduït a mà (una primera versió ho va fer així amb una graella independent i una taula `bank_budgets`, però es va desfer a petició de l'usuari). Enfocament final: el banc és un atribut de la **subcategoria** (camp `bank_id` nullable a `subcategories`, es tria a la pàgina Categories igual que el nom), i a la pàgina `/pressupostos` hi ha una taula "Total per banc" que **suma automàticament** els pressupostos de totes les subcategories que tenen aquell banc assignat — no s'hi introdueix res directament, es recalcula sol quan canvies el pressupost d'una subcategoria o el banc que té assignada. Les subcategories sense banc es sumen a la fila "Sense banc". Aquest càlcul es fa íntegrament al frontend (Vue), reutilitzant les dades que ja arriben (`categoriesList` amb `bank_id` de cada subcategoria + els pressupostos), sense cap petició ni taula addicional al backend. 4 tests Pest nous (afegits a `SubcategoryControllerTest.php`) i tests Vitest ampliats a `Categories/Index.spec.js` i `Pressupostos/Index.spec.js`, tots passant. Provat també manualment contra el servidor real.
- ✅ Gràfic de tendència de desviació: nova secció al Dashboard amb un gràfic de barres divergent (verd = per sota del pressupost, vermell = per sobre) de la desviació mensual, amb botons per triar la finestra (3/6/12 mesos, comptant enrere des del mes seleccionat). `DashboardController` sempre calcula i envia els 12 mesos (fins al seleccionat); el selector 3/6/12 només retalla l'array al frontend, sense fer cap petició nova al canviar de finestra. S'ha triat barra divergent (no horitzontal d'un sol color) seguint la guia de visualització de dades: és la forma recomanada per mostrar una desviació respecte a una línia base (0), amb un color per cada signe. 2 tests Pest nous (a `DashboardControllerTest.php`, incloent un cas que travessa el canvi d'any) i 5 tests Vitest nous (`DeviationTrendChart.spec.js` + ampliacions a `Dashboard/Index.spec.js`), tots passant. Provat també manualment contra el servidor real.
- ✅ Subtotals per categoria al pressupost: la fila de capçalera de cada categoria a la taula "Pressupost per subcategoria" (`/pressupostos`) ara mostra la suma de les seves subcategories per a cada mes i el total de l'any, en lloc de ser només una etiqueta separadora. Mateix patró de càlcul reactiu ja usat per als totals per banc (es recalcula sol, sense petició al servidor). 1 test Vitest nou.
- ✅ Colors de compliment al pressupost: a la taula "Pressupost per subcategoria" (`/pressupostos`), cada casella amb un import es pinta en **verd** si la despesa real d'aquell mes és igual o inferior al pressupostat, o en **vermell** si s'ha superat. Les caselles sense pressupost introduït no es pinten (no hi ha res a jutjar). `BudgetController::index` ara calcula també `actuals` (despesa real per subcategoria i mes, per a l'any consultat) a més de `budgets`. 1 test Pest nou i 3 tests Vitest nous, tots passant. Provat també manualment contra el servidor real.
- ✅ Gràfic "Despesa per subcategoria" del Dashboard passa a barres verticals: com que pot haver-hi moltes subcategories, la targeta creixia sense límit cap avall (una fila horitzontal per subcategoria). Ara aquest gràfic concret (`ExpenseBreakdownChart` amb `horizontal="false"`) fa servir barres de columna amb alçada de targeta fixa (260px) i, si hi ha moltes subcategories, amplada creixent amb scroll horitzontal intern — la pàgina ja no s'allarga. Els gràfics de categoria i banc es mantenen horitzontals (pocs elements, sense aquest problema). 2 tests Vitest nous.
- ✅ Tooltip de despesa real al pressupost: a la taula "Pressupost per subcategoria", passar el ratolí per sobre d'una casella mostra la despesa real d'aquell mes, o "cap" si encara no n'hi ha cap registrada. Complementa els colors verd/vermell amb la xifra exacta. Primer es va fer amb el `title` natiu del navegador, però l'usuari va notar que trigava a aparèixer (a diferència dels tooltips instantanis dels gràfics del Dashboard, que són de Chart.js); s'ha substituït per un tooltip propi fet amb CSS (`:hover` sobre la casella), sense dependències, que apareix a l'instant. 2 tests Vitest actualitzats.
- 📌 Planificat (no iniciat): mòdul Receptari / Menús setmanals / Llista de compra, ara que el nucli de despeses està acabat (vegeu secció anterior).

## Registre de decisions

| Data | Decisió |
|---|---|
| 2026-09-11 | Instal·lació inicial del projecte amb l'stack acordat. Substitució de Tailwind (per defecte a l'esquelet de Laravel) per Bootstrap, segons especificació. Substitució de PHPUnit per Pest. |
| 2026-09-19 | Planificació del mòdul futur Receptari / Menús setmanals / Llista de compra (PRO): es farà dins del mateix projecte com a mòdul separat, després d'acabar el nucli de control de despeses. |
| 2026-09-19 | Fase 1 (models i migracions) implementada. Pressupost confirmat com a **mensual per subcategoria** (no anual ni per categoria); els totals per categoria i any es calculen sumant, no es guarden per separat. |
| 2026-09-21 | Fase 2 (CRUD de despeses) implementada. Disseny confirmat amb l'usuari: una sola pàgina amb formulari ràpid + llistat amb edició/esborrat inline (millor per a mòbil que pàgines separades de crear/editar), i URLs de rutes en català (`/despeses`). |
| 2026-09-21 | Fase 3 (gestió de categories i subcategories) implementada, seguint el mateix patró de disseny aprovat a la fase 2 (pàgina única, edició inline). No es permet esborrar una categoria/subcategoria si té despeses associades (restricció de BD capturada i traduïda a un missatge d'error en català). |
| 2026-09-21 | Fase 4 (pressupost mensual per subcategoria) implementada com una graella (subcategories × 12 mesos) amb autodesat per casella, en lloc del patró de formulari ràpid + llistat de les fases anteriors (decisió acordada amb l'usuari, més adequada per omplir un any sencer). Abast limitat a la gestió del pressupost; la comparativa amb la despesa real queda per la fase 5 (decisió acordada amb l'usuari). |
| 2026-09-21 | Abans de la fase 5: (1) s'afegeix autenticació — un sol usuari, sense registre públic, creat per terminal; (2) es canvia el CSS de Bootstrap net a la plantilla **Tabler** (MIT, basada en Bootstrap 5) i les icones de `lucide-vue-next` a `@tabler/icons-vue`, aplicat a tota l'aplicació (no només a les pantalles noves). Totes dues decisions acordades explícitament amb l'usuari abans d'implementar-les. |
| 2026-09-21 | Fase 5 (dashboard i gràfics) implementada. Decisions confirmades amb l'usuari: vista mensual i anual juntes a la mateixa pàgina (no un commutador), i els gràfics de categoria/subcategoria corresponen al mes seleccionat (no a l'any sencer). Gràfics fets amb Chart.js/vue-chartjs com a barres horitzontals (no donut), seguint les recomanacions de visualització de dades per a comparació de magnituds. Amb aquesta fase es tanca el nucli de control de despeses previst al document. |
| 2026-09-21 | Polish visual a petició de l'usuari: favicon propi, pàgines 404/500 amb l'estil de Tabler, i mode fosc amb commutador al menú. |
| 2026-09-21 | Afegida l'entitat Bancs a petició de l'usuari (diferenciar despeses per banc). Decisions acordades: gestionables des de l'app (com categories), camp opcional a cada despesa, i inclòs ja al Dashboard amb un tercer gràfic. Esborrar un banc no bloqueja ni esborra despeses (a diferència de categories/subcategories), perquè és una dada secundària opcional. |
| 2026-09-21 | Afegit el pressupost per banc a petició de l'usuari. Decisió acordada: independent del pressupost per categoria/subcategoria (no un encreuament banc × categoria/subcategoria), per no multiplicar excessivament la feina d'introduir dades cada mes. |
| 2026-09-21 | Rectificat: el pressupost per banc **no** s'introdueix a mà (es desfà la graella independent i la taula `bank_budgets`). Nou enfocament acordat amb l'usuari: el banc és un atribut fix de la subcategoria (es tria un cop, a Categories), i el "total per banc" a la pàgina de pressupostos es calcula automàticament sumant els pressupostos de les subcategories d'aquell banc. |
| 2026-09-21 | Afegit el gràfic de tendència de desviació (pressupost vs. despesa real) al Dashboard, a petició de l'usuari. Decisions acordades: mostra només la desviació (no pressupost i despesa real per separat), amb selector 3/6/12 mesos, ubicat al Dashboard (no a Pressupostos). |
