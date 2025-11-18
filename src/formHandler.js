document.getElementById('gameForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    // Collect selected categories
    const categories = [];
    e.target.querySelectorAll('input[name="categories"]:checked').forEach(cb => {
        categories.push(cb.value);
    });

    // Append categories as JSON string
    formData.append('categories', JSON.stringify(categories));

    try {
        const response = await fetch('/videogame/new', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Error al guardar el videojuego');

        const result = await response.text();
        alert('Videojuego guardado correctamente');
        console.log(result);
    } catch (error) {
        console.error(error);
        alert('Hubo un problema al guardar el videojuego');
    }
});