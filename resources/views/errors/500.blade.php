<!DOCTYPE html>
<html lang="ca">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <title>Error del servidor — Control de despeses</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
        <script>
            (function () {
                try {
                    var theme = localStorage.getItem('theme');
                    if (!theme) {
                        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                    document.documentElement.setAttribute('data-bs-theme', theme);
                } catch (e) {
                    // localStorage not available (private browsing, etc.) — default to light.
                }
            })();
        </script>
        @vite(['resources/css/app.css'])
    </head>
    <body>
        <div class="page page-center">
            <div class="container-tight py-4 text-center">
                <div class="empty">
                    <div class="empty-header">500</div>
                    <p class="empty-title">Alguna cosa ha anat malament</p>
                    <p class="empty-subtitle text-secondary">
                        Hi ha hagut un error inesperat. Torna-ho a provar d'aquí una estona.
                    </p>
                    <div class="empty-action">
                        <a href="/despeses" class="btn btn-primary">Torna a l'inici</a>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
