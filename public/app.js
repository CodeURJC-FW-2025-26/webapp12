// public/app.js
const NUM_RESULTS = 6;
let loadMoreRequests = 0;
let isLoading = false;
let hasMoreContent = true;

async function loadMore() {
    if (isLoading || !hasMoreContent) return;

    const from = (loadMoreRequests + 1) * NUM_RESULTS;
    const to = from + NUM_RESULTS;
    let url = window.location.pathname + window.location.search;

    // Construir URL para la petición AJAX
    if (url.includes('?')) {
        url += '&from=' + from + '&to=' + to;
    } else {
        url += '?from=' + from + '&to=' + to;
    }

    isLoading = true;

    // Crear y mostrar spinner dinámicamente (no ocupa espacio hasta que se necesita)
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.innerHTML = `
            <div class="spinner-border">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        spinner.style.display = 'flex';
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const newGames = await response.text();

        // Verificar si realmente hay contenido nuevo
        if (newGames.trim() === '') {
            hasMoreContent = false;
            if (spinner) {
                spinner.innerHTML = '<p class="text-muted mt-3">No hay más videojuegos</p>';
            }
            return;
        }

        // Insertar el nuevo contenido
        document.getElementById("videogamesContainer").insertAdjacentHTML('beforeend', newGames);
        loadMoreRequests++;

    } catch (error) {
        console.error('Error al cargar más videojuegos:', error);
        if (spinner) {
            spinner.innerHTML = '<p class="text-danger mt-3">Error al cargar. Intenta de nuevo.</p>';
        }
        // Permitir reintentar después de un error
        hasMoreContent = true;
    } finally {
        isLoading = false;

        // Ocultar spinner después de un breve momento (pero mantener el mensaje si hay error o fin)
        if (spinner && hasMoreContent) {
            setTimeout(() => {
                spinner.style.display = 'none';
            }, 300);
        }
    }
}

// Función para verificar si debemos cargar más contenido
function shouldLoadMore() {
    // Calcular si el usuario está cerca del final (300px antes del final)
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    // También verificar si hay elementos visibles
    const container = document.getElementById("videogamesContainer");
    if (!container || container.children.length === 0) return false;

    // Cargar cuando estemos a 300px del final
    return (scrollPosition >= documentHeight - 300);
}

// Debounce para el scroll (evitar múltiples llamadas)
let scrollTimeout;
window.addEventListener('scroll', function () {
    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(async function () {
        if (shouldLoadMore() && !isLoading && hasMoreContent) {
            await loadMore();
        }
    }, 150); // 150ms de debounce
});

// Cargar inicialmente cuando la página se carga
document.addEventListener('DOMContentLoaded', function () {
    // Si hay pocos elementos iniciales, cargar más automáticamente
    const container = document.getElementById("videogamesContainer");
    if (container && container.children.length < NUM_RESULTS) {
        setTimeout(() => {
            if (shouldLoadMore()) {
                loadMore();
            }
        }, 1000);
    }
});