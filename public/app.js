
const NUM_RESULTS = 6;
let loadMoreRequests = 0;

async function loadMore() {
    const from = (loadMoreRequests + 1) * NUM_RESULTS;
    const to = from + NUM_RESULTS;

    const response = await fetch(`/videogames?from=${from}&to=${to}`);
    const newGames = await response.text();

    const container = document.getElementById("videogamesContainer");
    container.innerHTML += newGames;

    loadMoreRequests++;
}

// Infinite scroll - se activa al bajar
window.addEventListener('scroll', function () {
    // Si estamos cerca del final (100px)
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        loadMore();
    }
});

// También mantener el botón funcional
window.loadMore = loadMore;
