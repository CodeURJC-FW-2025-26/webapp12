const NUM_RESULTS = 6;
let loadMoreRequests = 0;
let cargando = false;
let noHayMasContenido = false;

// Función para ocultar el spinner inicial
function ocultarSpinnerInicial() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
        console.log("Spinner ocultado al cargar la página");
    }
}

async function loadMore() {
    if (cargando || noHayMasContenido) return;
    cargando = true;

    const spinner = document.getElementById('loadingSpinner');

    // MOSTRAR spinner cuando empieza a cargar
    if (spinner) {
        spinner.style.display = 'flex';
        console.log("Spinner mostrado (cargando más...)");
    }

    try {
        const from = (loadMoreRequests + 1) * NUM_RESULTS;
        const to = from + NUM_RESULTS;

        let url = window.location.pathname + window.location.search;

        if (url.includes('?')) {
            url += `&from=${from}&to=${to}`;
        } else {
            url += `?from=${from}&to=${to}`;
        }

        const response = await fetch(url);
        const newGames = await response.text();

        // Verificar si NO hay contenido
        if (newGames.trim() === '' || newGames.includes('No hay videojuegos')) {
            noHayMasContenido = true;
            console.log("No hay más contenido disponible");

            // Ocultar spinner inmediatamente
            if (spinner) {
                spinner.style.display = 'none';
            }
            return;
        }

        // Agregar nuevo contenido
        document.getElementById("videogamesContainer").innerHTML += newGames;
        loadMoreRequests++;

        console.log(`Cargados ${loadMoreRequests * NUM_RESULTS} juegos`);

    } catch (error) {
        console.error("Error cargando más contenido:", error);
    } finally {
        // Ocultar spinner después de cargar
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
            console.log("Spinner ocultado (carga completada)");
        }
        cargando = false;
    }
}

// Scroll infinito
window.addEventListener('scroll', function () {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        loadMore();
    }
});

// ESPERAR A QUE TODA LA PÁGINA ESTÉ COMPLETAMENTE CARGADA
window.addEventListener('load', function () {
    console.log("Página completamente cargada");
    ocultarSpinnerInicial();

    // También verificar si hay contenido inicial
    const container = document.getElementById("videogamesContainer");
    if (container) {
        const juegosIniciales = container.querySelectorAll('.col-md-6, .col-lg-4');
        console.log(`Juegos iniciales cargados: ${juegosIniciales.length}`);

        // Si hay menos juegos de los que se pueden mostrar por página,
        // significa que no hay más contenido
        if (juegosIniciales.length < NUM_RESULTS) {
            noHayMasContenido = true;
            console.log("No hay más contenido (menos de " + NUM_RESULTS + " juegos iniciales)");
        }
    }
});

// También ocultar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM completamente cargado");

    // Ocultar spinner temporalmente, pero podría mostrarse
    // si la página todavía está cargando imágenes
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
});