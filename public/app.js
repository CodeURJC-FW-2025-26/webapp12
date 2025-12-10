const NUM_RESULTS = 6;
let loadMoreRequests = 0;
let cargando = false;

async function loadMore() {
    if (cargando) return;
    cargando = true;

    // Mostrar spinner ANTES de cargar
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'flex';

    const from = (loadMoreRequests + 1) * NUM_RESULTS;
    const to = from + NUM_RESULTS;

    try {
        const response = await fetch(`/videogames?from=${from}&to=${to}`);
        const newGames = await response.text();

        // Verificar si hay contenido nuevo
        if (newGames.trim() === '') {
            // No hay más contenido - ELIMINAR spinner del HTML
            if (spinner) spinner.remove();
            return;
        }

        const container = document.getElementById("videogamesContainer");
        container.innerHTML += newGames;

        loadMoreRequests++;

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Ocultar spinner DESPUÉS de cargar
        if (spinner && spinner.parentNode) {
            spinner.style.display = 'none';
        }
        cargando = false;
    }
}

const pathname = window.location.pathname;
const search = window.location.search;

if (!pathname.includes('/category/') && !search.includes('q=')) {
    window.addEventListener('scroll', function () {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
            loadMore();
        }
    });
}