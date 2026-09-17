<laravel-boost-guidelines>
# Aplicació Laravel

Aquest repositori conté una aplicació Laravel. Completa la configuració següent abans de treballar en la sol·licitud de l'usuari.

## Requisits previs

Comprova que PHP i Composer estiguin disponibles:

```sh
php -v
composer -V
```

Si alguna de les dues ordres no està disponible, detecta el sistema operatiu de l'usuari i instal·la els requisits amb l'ordre corresponent:

macOS:

```sh
/bin/bash -c "$(curl -fsSL https://php.new/install/mac/8.5)"
```

Windows PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.5'))
```

Linux:

```sh
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.5)"
```

Després de la instal·lació, demana a l'usuari que reiniciï el terminal. Si l'agent necessita el terminal reiniciat per continuar, demana a l'usuari que torni a obrir el terminal i que torni a executar la seva sol·licitud original.

## Configuració de l'agent

Instal·la Laravel Boost des de l'arrel de l'aplicació abans de fer canvis a l'aplicació:

```sh
composer require laravel/boost --dev
php artisan boost:install
```

Boost substitueix aquestes instruccions d'arrencada per unes directrius adaptades a l'aplicació. Després de la instal·lació, torna a llegir `AGENTS.md` i continua amb la sol·licitud original de l'usuari seguint les directrius generades.
</laravel-boost-guidelines>

## Context del projecte

Abans de treballar en aquest repositori, llegeix sempre [`PROJECTE.md`](PROJECTE.md). Conté els objectius de l'aplicació, l'stack tècnic, les categories/subcategories inicials, les convencions de codi i les regles de treball definides per l'usuari (desenvolupament fase a fase, aprovació prèvia abans d'implementar, tests obligatoris a cada canvi, interfície sempre en català).

Aquest document evoluciona amb el projecte: si es prenen noves decisions, canvia l'stack o s'amplien els requisits, actualitza `PROJECTE.md` en conseqüència (secció "Registre de decisions" i "Estat actual").
