import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import { ObjectId } from 'mongodb';

import * as videogame from './videogame.js';

const router = express.Router();
export default router;

const upload = multer({ dest: videogame.UPLOADS_FOLDER })


router.post('/create', upload.single('image'), async (req, res) => {
  // Collect validation errors
  const errors = [];
  const title = req.body.title?.trim() || '';
  const trailer = req.body.trailer.trim() || '';
  const description = req.body.description?.trim() || '';
  const year = req.body.year;
  const gameId = req.body.id || null; // Hidden input for edit mode


  //Validate year
  const actualYear = new Date().getFullYear();
  if(year<1950 && year> actualYear+1){
    error.push('El año no puede ser inferior a 1950 ni superior al año que viene')
  }

  // Validate trailer
  if(!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(trailer)){
    errors.push('El trailer debe ser una URL de youtube')
  }

  // Validate: title must start with a capital letter
  if (!/^[A-ZÁÉÍÓÚÑ]/.test(title)) {
    errors.push('El nombre debe comenzar con mayúscula.');
  }

  // Validate: description length between 20 and 350 characters
  if (description.length < 20 || description.length > 350) {
    errors.push('La descripción debe tener entre 20 y 350 caracteres.');
  }

  // Check if title already exists in DB
  const existingGame = await videogame.getVideogameByTitle(title);
  if (existingGame && (!gameId || existingGame._id.toString() !== gameId)) {
    // Only error if it's a different game
    errors.push('El nombre ya existe en la base de datos.');
  }

  // If there are validation errors, render error page
  if (errors.length > 0) {
    return res.status(400).render('errorWhenUpload', {
      nombre: title || 'Sin título',
      errores: errors
    });
  }

  // Prepare data for insert or update
  const videogameData = {
    title,
    description,
    price: req.body.price,
    platform: req.body.platform,
    year: req.body.year,
    developer: req.body.developer,
    categories: Array.isArray(req.body.genres) ? req.body.genres : [req.body.genres],
    imageFilename: req.file ? req.file.filename : req.body.existingImage || null,
    trailer: req.body.trailer
  };

  if (gameId) {
    // Update existing game
    await videogame.updateVideogame(gameId, videogameData);
    console.log('Updated in MongoDB:', gameId);
    return res.render('uploadVideogame', { _id: gameId });
  }

  // Insert new game
  videogameData.createdAt = new Date();
  videogameData.comments = [];
  const result = await videogame.addVideogame(videogameData);
  console.log('Inserted into MongoDB:', result);
  res.render('uploadVideogame', { _id: result.insertedId.toString() });
});



router.get('/edit/:id', async (req, res) => {
  const game = await videogame.getVideogame(req.params.id);
  if (!game) return res.status(404).send('Videojuego no encontrado');

  // Todas las categorías posibles
  const allGenres = [
    'RPG', 'Shooter', 'Creativo', 'Estrategia', 'Bélico',
    'Acción', 'Carreras', 'MOBA', 'Sandbox', 'Mundo Abierto', 'Simulación', 'Supervivencia'
  ];

  // Array con las categorías seleccionadas del juego
  const selectedGenres = game.categories || [];

  // Generamos un array con flags para Mustache
  const genresWithFlags = allGenres.map(genre => ({
    name: genre,
    checked: selectedGenres.includes(genre) ? 'checked' : ''
  }));
  
  // Generamos la URL para la imagen si existe
  const imageUrl = game.imageFilename ? `/uploads/${game.imageFilename}` : null;


  res.render('create', {
    ...game,
    genresWithFlags,
    imageUrl,
    isPC: game.platform === 'PC',
    isXbox: game.platform === 'xbox_seriesx',
    isPS5: game.platform === 'PS5',
    isSwitch: game.platform === 'nintendoswitch'
  });
});


router.get('/detail/:id', async (req, res) => {
    const game = await videogame.getVideogame(req.params.id);
    if (!game) return res.status(404).send('Videojuego no encontrado');


    // Format trailer URL to embed format
    if (game.trailer) {
        game.trailerEmbed = formatTrailerUrl(game.trailer);
    }


    const comments = game.comments || [];
    comments.sort((a,b) => new Date(b.date) - new Date(a.date));
    let sum = 0;
    comments.forEach(c => { sum += c.stars||0; c.stars_visual = '★'.repeat(c.stars||0)+'☆'.repeat(5-(c.stars||0)) });
    
    game.totalComments = comments.length;

    game.averageStars = comments.length ? (sum/comments.length).toFixed(1) : 0;
    game.averageStarsVisual = '★'.repeat(Math.round(game.averageStars))+'☆'.repeat(5-Math.round(game.averageStars));


    /// Show games with same platform
    const allGames = await videogame.getVideogames();

    const relatedGames = allGames
        .filter(g => g.platform === game.platform && g._id.toString() !== game._id.toString())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);

    res.render('detail', { game, relatedGames });


    // Function to convert URL to embed format
    function formatTrailerUrl(url) {
        if (url.includes('youtu.be')) {
            const videoId = url.split('youtu.be/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtube.com/watch')) {
            const videoId = new URL(url).searchParams.get('v');
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return url; // If it's already in embed format or not YouTube
    }



});

  

router.get('/detail/:id/deleteVideogame', async (req, res) => {

    let idGame = await videogame.deleteVideogame(req.params.id);

    if (idGame && idGame.imageFilename) {
        await fs.rm(videogame.UPLOADS_FOLDER + '/' + idGame.imageFilename);
    }

    res.render('deleteVideogame', idGame);

});

router.post('/detail/:id/comment', async (req, res) => {
    const { userName, reviewText, rating } = req.body;

    const game = await videogame.getVideogame(req.params.id);

    const newComment = {
        _id: new ObjectId(),
        user: userName,
        text: reviewText,
        stars: parseInt(rating),
        date: new Date().toISOString().split('T')[0]
    };

    await videogame.addComment(req.params.id, newComment);

    res.render('uploadComment', { game });
});

router.get('/detail/:id/comment/:commentId/delete', async (req, res) => {
    const { id, commentId } = req.params;
    const game = await videogame.getVideogame(req.params.id);

    await videogame.deleteComment(id, commentId);

    res.render('deleteComment', { game });
});

router.get('/detail/:id/comment/:commentId/edit', async (req, res) => {
    const game = await videogame.getVideogame(req.params.id);
    if (!game) return res.status(404).send('Videojuego no encontrado');

    const comment = game.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) return res.status(404).send('Comentario no encontrado');

    // Preparamos un objeto para cada estrella para mostrar "checked"
    comment.starsChecked = {
        1: comment.stars === 1 ? 'checked' : '',
        2: comment.stars === 2 ? 'checked' : '',
        3: comment.stars === 3 ? 'checked' : '',
        4: comment.stars === 4 ? 'checked' : '',
        5: comment.stars === 5 ? 'checked' : ''
    };

    res.render('editComment', { game, comment });
});


router.post('/detail/:id/comment/:commentId/edit', async (req, res) => {

    const game = await videogame.getVideogame(req.params.id);

    const { reviewText } = req.body;
    const ratingField = `rating-${req.params.commentId}`;
    const stars = parseInt(req.body[ratingField]) || 0;

    await videogame.editComment(req.params.id, req.params.commentId, reviewText, stars);

    res.render('modifyComment', { game });
});


router.get('/post/:id/image', async (req, res) => {

    let post = await videogame.getVideogame(req.params.id);

    res.download(videogame.UPLOADS_FOLDER + '/' + post.imageFilename);

});


router.get('category/:cat', async (req, res) => {
  const selectedCategory = req.params.cat;
  const page = parseInt(req.query.page) || 1;
  const limit = 6;

  // Filtrar videojuegos por categoría
  let videogames = await videogame.getVideogames();
  videogames = videogames.filter(v => v.categories?.includes(selectedCategory));

  const totalVideogames = videogames.length;
  const totalPages = Math.ceil(totalVideogames / limit);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const videogamesAct = videogames.slice(startIndex, endIndex);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({
      number: i,
      isActive: i === page
    });
  }

  // Juego sugerido aleatorio
  const allVideogames = await videogame.getVideogames();
  let suggestedGame = null;
  if (allVideogames.length > 0) {
    suggestedGame = allVideogames[Math.floor(Math.random() * allVideogames.length)];
  }

  // Obtener categorías reales
  const categorySet = new Set();
  allVideogames.forEach(g => g.categories?.forEach(c => categorySet.add(c)));
  const allCategories = Array.from(categorySet).sort();

  res.render('index', {
    videogamesAct,
    suggestedGame,
    currentPage: page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    prevPage: page - 1,
    nextPage: page + 1,
    pages,
    allCategories,
    selectedCategory
  });
});



router.get('/', async (req, res) => {
    const query = req.query.q?.trim() || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 6; // cantidad de videojuegos por página

    // Obtener videojuegos
    let videogames = query === ""
        ? await videogame.getVideogames()
        : await videogame.searchVideogames(query);

    const totalVideogames = videogames.length;
    const totalPages = Math.ceil(totalVideogames / limit);

    // Recortar los resultados según la página actual
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const videogamesAct = videogames.slice(startIndex, endIndex);

    // Generar lista de páginas (ej: [1,2,3,4,...])
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push({
            number: i,
            isActive: i === page
        });
    }

    // Juego sugerido aleatorio
    const allVideogames = await videogame.getVideogames();
    let suggestedGame = null;
    if (allVideogames.length > 0) {
        const randomIndex = Math.floor(Math.random() * allVideogames.length);
        suggestedGame = allVideogames[randomIndex];
    }

    //categories filter all get categories
    const categorySet = new Set();
    videogames.forEach(g => g.categories?.forEach(c => categorySet.add(c)));
    const allCategories = Array.from(categorySet).sort();


  res.render('index', {
    videogamesAct,
    suggestedGame,
    currentPage: page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    prevPage: page - 1,
    nextPage: page + 1,
    pages,
    allCategories
  });

});

