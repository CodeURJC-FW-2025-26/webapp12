// public/app.js
const NUM_RESULTS = 6;
let page = 0;
let loading = false;

async function loadMore() {
    if (loading) return;

    loading = true;
    page++;

    // Mostrar spinner
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'flex';

    try {
        const from = page * NUM_RESULTS;
        const to = from + NUM_RESULTS;
        let url = window.location.pathname + window.location.search;

        url += url.includes('?') ? `&from=${from}&to=${to}` : `?from=${from}&to=${to}`;

        const response = await fetch(url);
        const html = await response.text();

        if (html.trim()) {
            document.getElementById("videogamesContainer").innerHTML += html;
        } else {
            if (spinner) spinner.innerHTML = '<p class="text-muted">Fin</p>';
        }
    } finally {
        // Ocultar spinner después
        setTimeout(() => {
            if (spinner) spinner.style.display = 'none';
            loading = false;
        }, 300);
    }
}

// Scroll simple
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        loadMore();
    }
});