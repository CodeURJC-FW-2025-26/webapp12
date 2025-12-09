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