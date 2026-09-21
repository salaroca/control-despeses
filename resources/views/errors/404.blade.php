<!DOCTYPE html>
<html lang="ca">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <title>Pàgina no trobada — Control de despeses</title>
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
                    <div class="empty-header">404</div>
                    <p class="empty-title">Pàgina no trobada</p>
                    <p class="empty-subtitle text-secondary">
                        La pàgina que busques no existeix o s'ha mogut.
                    </p>
                    <div class="empty-action">
                        <a href="/despeses" class="btn btn-primary">Torna a l'inici</a>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
