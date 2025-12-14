import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import { ObjectId } from 'mongodb';

import * as videogame from './videogame.js';

const router = express.Router();
export default router;

const upload = multer({ dest: videogame.UPLOADS_FOLDER })

// Endpoint to validate the data from the form in client (AJAX)
router.post('/create/validate', async (req, res) => {
  const errors = [];
  const gameId = req.body.id || null;
  const videogameData = {
    title: req.body.title,
    description: req.body.description || '',
    price: req.body.price,
    platform: req.body.platform,
    year: req.body.year,
    developer: req.body.developer,
    categories: Array.isArray(req.body.genres) ? req.body.genres : (req.body.genres ? [req.body.genres] : []),
    imageFilename: req.body.existingImage || null,
    trailer: req.body.trailer
  };

  // Check if title already exists in DB
  const existingGame = await videogame.getVideogameByTitle(videogameData.title);
  if (existingGame && (!gameId || existingGame._id.toString() !== gameId.toString())) {
    errors.push('El nombre ya existe en la base de datos.');
  }
  // Validate: title must start with a capital letter
  if (!videogameData.title || typeof videogameData.title !== "string" || !/^[A-ZÁÉÍÓÚÑ]/.test(videogameData.title)) {
    errors.push('El nombre debe comenzar con mayúscula.');
  }
  // Validate: description length between 20 and 350 characters
  if ((videogameData.description || '').length < 20 || (videogameData.description || '').length > 350) {
    errors.push('La descripción debe tener entre 20 y 350 caracteres.');
  }

  // Validate Price
  if(!videogameData.price || isNaN(Number(videogameData.price))){
    errors.push('El precio debe ser un numero valido');
  }
  // Validate year
  const actualYear = new Date().getFullYear();
  const yearNum = parseInt(videogameData.year, 10);
  if (!videogameData.year || isNaN(yearNum) || yearNum < 1950 || yearNum > actualYear + 1) {
    errors.push('El año no puede ser inferior a 1950 ni superior al año que viene');
  }
  // Validate Studio
  if (!videogameData.developer || typeof videogameData.developer !== "string") {
    errors.push('El Estudio debe ser un nombre escrito con letras');
  }
  // Validate trailer
  if (!videogameData.trailer || typeof videogameData.trailer !== "string" || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(videogameData.trailer)) {
    errors.push('El trailer debe ser una URL de YouTube');
  }

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  return res.json({ ok: true });
});

router.post('/create', upload.single('image'), async (req, res) => {
  // Collect validation errors
  const errors = [];
  const gameId = req.body.id || null; // Hidden input for edit mode
    // Prepare data for insert or update
  const videogameData = {
    title: req.body.title,
    description: req.body.description,
    price: req.body.price,
    platform: req.body.platform,
    year: req.body.year,
    developer: req.body.developer,
    categories: Array.isArray(req.body.genres) ? req.body.genres : [req.body.genres],
    imageFilename: req.file ? req.file.filename : req.body.existingImage || null,
    trailer: req.body.trailer
  };

  // Check if title already exists in DB
  const existingGame = await videogame.getVideogameByTitle(videogameData.title);
  if (existingGame && (!gameId || existingGame._id.toString() !== gameId.toString())) {
    // Only error if it's a different game
    errors.push('El nombre ya existe en la base de datos.');
  }
  // Validate: title must start with a capital letter
  if (!videogameData.title || typeof videogameData.title !== "string" || !/^[A-ZÁÉÍÓÚÑ]/.test(videogameData.title)) {
    errors.push('El nombre debe comenzar con mayúscula.');
  }
  // Validate: description length between 20 and 350 characters
  if (videogameData.description.length < 20 || videogameData.description.length > 350) {
    errors.push('La descripción debe tener entre 20 y 350 caracteres.');
  }

  // Validate Price
  if(!videogameData.price || isNaN(Number(videogameData.price))){
    errors.push('El precio debe ser un numero valido');
  }
  // Validate year
  const actualYear = new Date().getFullYear();
  const yearNum = parseInt(videogameData.year, 10);
  if (!videogameData.year || isNaN(yearNum) || yearNum < 1950 || yearNum > actualYear + 1) {
    errors.push('El año no puede ser inferior a 1950 ni superior al año que viene');
  }
  // Validate Studio
  if (!videogameData.developer || typeof videogameData.developer !== "string") {
    errors.push('El Estudio debe ser un nombre escrito con letras');
  }
  // Validate trailer
  if (!videogameData.trailer || typeof videogameData.trailer !== "string" || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(videogameData.trailer)) {
    errors.push('El trailer debe ser una URL de YouTube');
  }



  // If there are validation errors, render unified confirmOrError view with errors
  if (errors.length > 0) {
    return res.status(400).render('confirmOrError', {
      pageTitle: 'Error al añadir videojuego',
      heroTitle: 'Error al añadir videojuego',
      iconClass: 'bi-x-circle-fill',
      iconColor: 'text-danger',
      heading: 'No se pudo añadir el videojuego',
      infoLabel: 'Videojuego:',
      infoValue: videogameData.title || 'Sin título',
      message: 'Revisa los datos del formulario e inténtalo de nuevo.',
      hasErrors: true,
      errors: errors,
      actions: [
        { href: '/', label: 'Volver al inicio', icon: 'bi-house' },
        { href: '/create', label: 'Volver al formulario', icon: 'bi-plus-circle', outline: true }
      ]
    });
  }



  if (gameId) {
    // Update existing game
    await videogame.updateVideogame(gameId, videogameData);
    console.log('Updated in MongoDB:', gameId);
    return res.render('confirmOrError', {
      pageTitle: 'Videojuego guardado',
      heroTitle: 'Página de videojuego guardado',
      iconClass: 'bi-check-circle-fill',
      iconColor: 'text-success',
      heading: '¡Videojuego guardado correctamente!',
      infoLabel: 'Videojuego:',
      infoValue: videogameData.title,
      message: 'El videojuego ha sido actualizado correctamente.',
      actions: [
        { href: '/', label: 'Volver al inicio', icon: 'bi-house' },
        { href: `/detail/${gameId}`, label: 'Ver detalles', icon: 'bi-plus-circle', outline: true }
      ]
    });
  }

  // Insert new game
  videogameData.createdAt = new Date();
  videogameData.comments = [];
  const result = await videogame.addVideogame(videogameData);
  console.log('Inserted into MongoDB:', result);
  res.render('confirmOrError', {
    pageTitle: 'Videojuego añadido',
    heroTitle: 'Página de videojuego añadido',
    iconClass: 'bi-check-circle-fill',
    iconColor: 'text-success',
    heading: '¡Videojuego añadido correctamente!',
    infoLabel: 'Videojuego:',
    infoValue: videogameData.title,
    message: 'El videojuego ha sido agregado exitosamente al catálogo.',
    actions: [
      { href: '/', label: 'Volver al inicio', icon: 'bi-house' },
      { href: `/detail/${result.insertedId.toString()}`, label: 'Ver detalles', icon: 'bi-plus-circle', outline: true }
    ]
  });
});



router.get('/edit/:id', async (req, res) => {
  const game = await videogame.getVideogame(req.params.id);
  if (!game) return res.status(404).send('Videojuego no encontrado');

  // All possible categories (fixed set for form rendering)
  const allGenres = [
    'RPG', 'Shooter', 'Creativo', 'Estrategia', 'Bélico',
    'Acción', 'Carreras', 'MOBA', 'Sandbox', 'Mundo Abierto', 'Simulación', 'Supervivencia'
  ];

  // Categories selected for this game
  const selectedGenres = game.categories || [];

  // Build array with 'checked' flag for Mustache template
  const genresWithFlags = allGenres.map(genre => ({
    name: genre,
    checked: selectedGenres.includes(genre) ? 'checked' : ''
  }));
  
  // Build current image URL if an image exists
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
    try {
      const deleted = await videogame.deleteVideogame(req.params.id);
      // Make delete idempotent: if not found, still respond OK
      if (!deleted) {
        return res.status(200).send('OK');
      }
      if (deleted.imageFilename) {
        try { await fs.rm(videogame.UPLOADS_FOLDER + '/' + deleted.imageFilename); } catch {}
      }
      return res.status(200).send('OK');
    } catch (err) {
      return res.status(500).send('Error del servidor al borrar');
    }
});

router.post('/detail/:id/comment', async (req, res) => {
  const { userName, reviewText, rating } = req.body;

  const game = await videogame.getVideogame(req.params.id);

  // Username validation
  const name = (userName || '').trim();
  const errors = [];
  // Rules: 5-20 chars, starts with letter (accents allowed), then letters/numbers/space/_.- ; no double spaces or double symbols
  const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9._\- ]{4,19}$/;
  if (name.length < 5) errors.push('El nombre debe tener al menos 5 caracteres.');
  if (name.length > 30) errors.push('El nombre no puede superar los 30 caracteres.');
  if (!nameRegex.test(name)) {
    errors.push('El nombre debe empezar por letra y solo puede contener letras, números, espacios, "_", "-" y ".".');
  }
  if (/\s{2,}/.test(name)) {
    errors.push('No se permiten espacios múltiples consecutivos.');
  }
  if (/[._-]{2}/.test(name)) {
    errors.push('No se permiten dos símbolos seguidos (., _, -).');
  }

  if (errors.length > 0) {
    return res.status(400).render('confirmOrError', {
      pageTitle: 'Error al publicar comentario',
      heroTitle: 'Error al publicar comentario',
      iconClass: 'bi-x-circle-fill',
      iconColor: 'text-danger',
      heading: 'No se pudo publicar tu comentario',
      infoLabel: 'Videojuego:',
      infoValue: game.title,
      message: `Nombre introducido: ${name || 'Nombre no válido'}`,
      hasErrors: true,
      errors: errors,
      actions: [
        { href: '/', label: 'Volver al inicio', icon: 'bi-house' },
        { href: `/detail/${game._id}`, label: 'Ver detalles', icon: 'bi-plus-circle', outline: true }
      ]
    });
  }

  const newComment = {
    _id: new ObjectId(),
    user: name,
    text: (reviewText || '').trim(),
    stars: Math.max(0, Math.min(5, parseInt(rating) || 0)),
    date: new Date().toISOString().split('T')[0]
  };

    await videogame.addComment(req.params.id, newComment);

    res.render('confirmOrError', {
      pageTitle: 'Comentario añadido',
      heroTitle: 'Página de comentario añadido',
      iconClass: 'bi-check-circle-fill',
      iconColor: 'text-success',
      heading: '¡Comentario añadido correctamente!',
      infoLabel: 'Videojuego:',
      infoValue: game.title,
      message: `El comentario ha sido añadido exitosamente en el videojuego ${game.title}.`,
      actions: [
        { href: '/', label: 'Volver al inicio', icon: 'bi-house' },
        { href: `/detail/${game._id}`, label: 'Ver detalles', icon: 'bi-plus-circle', outline: true }
      ]
    });
});

// Delete comments
router.get('/detail/:id/comment/:commentId/delete', async (req, res) => {
    const { id, commentId } = req.params;
    const game = await videogame.getVideogame(req.params.id);

    await videogame.deleteComment(id, commentId);

    res.render('confirmOrError', {
      pageTitle: 'Comentario eliminado',
      heroTitle: 'Página de comentario eliminado',
      iconClass: 'bi-check-circle-fill',
      iconColor: 'text-success',
      heading: '¡Comentario eliminado correctamente!',
      infoLabel: 'Videojuego:',
      infoValue: game.title,
      message: `El comentario ha sido eliminado exitosamente del videojuego ${game.title}.`,
      actions: [
        { href: '/', label: 'Volver al inicio', icon: 'bi-house' },
        { href: `/detail/${game._id}`, label: 'Ver detalles', icon: 'bi-plus-circle', outline: true }
      ]
    });
});


// Get stars for each comment in edit
router.get('/detail/:id/comment/:commentId/edit', async (req, res) => {
    const game = await videogame.getVideogame(req.params.id);
    if (!game) return res.status(404).send('Videojuego no encontrado');

    const comment = game.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) return res.status(404).send('Comentario no encontrado');

    // Prepare an object for each star to show "checked"
    comment.starsChecked = {
        1: comment.stars === 1 ? 'checked' : '',
        2: comment.stars === 2 ? 'checked' : '',
        3: comment.stars === 3 ? 'checked' : '',
        4: comment.stars === 4 ? 'checked' : '',
        5: comment.stars === 5 ? 'checked' : ''
    };

    res.render('editComment', { game, comment });
});

// Edit comments validation
router.post('/detail/:id/comment/:commentId/edit', async (req, res) => {

    const game = await videogame.getVideogame(req.params.id);

    const { reviewText } = req.body;
    const ratingField = `rating-${req.params.commentId}`;
    const stars = parseInt(req.body[ratingField]) || 0;

    await videogame.editComment(req.params.id, req.params.commentId, reviewText, stars);

    res.render('confirmOrError', {
      pageTitle: 'Comentario modificado',
      heroTitle: 'Página de comentario modificado',
      iconClass: 'bi-check-circle-fill',
      iconColor: 'text-success',
      heading: '¡Comentario modificado correctamente!',
      infoLabel: 'Videojuego:',
      infoValue: game.title,
      message: `El comentario ha sido modificado exitosamente del videojuego ${game.title}.`,
      actions: [
        { href: '/', label: 'Volver al inicio', icon: 'bi-house' },
        { href: `/detail/${game._id}`, label: 'Ver detalles', icon: 'bi-plus-circle', outline: true }
      ]
    });
});


// Get image for a game
router.get('/game/:id/image', async (req, res) => {

    let game = await videogame.getVideogame(req.params.id);

    res.download(videogame.UPLOADS_FOLDER + '/' + game.imageFilename);
});


// Get videogames by category
router.get('/category/:cat', async (req, res) => {
  const selectedCategory = req.params.cat;
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const from = parseInt(req.query.from) || 0;
  const to = parseInt(req.query.to) || 6;

  // Get all games and filter by category
  let videogames = await videogame.getVideogames();
  videogames = videogames.filter(v => v.categories?.includes(selectedCategory));

  // If it's an AJAX request for infinite scroll (has 'from' parameter)
  if (req.query.from !== undefined) {
    videogames.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = videogames.slice(from, to);
    return res.render("videogames", {
      videogamesAct: result
    });
  }

  // Normal page load - render full page with pagination
  const totalVideogames = videogames.length;
  const totalPages = Math.ceil(totalVideogames / limit);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const videogamesAct = videogames.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({
      number: i,
      isActive: i === page
    });
  }

  // Get random suggested game
  const allVideogames = await videogame.getVideogames();
  let suggestedGame = null;
  if (allVideogames.length > 0) {
    suggestedGame = allVideogames[Math.floor(Math.random() * allVideogames.length)];
  }

  // Extract all unique categories for filter sidebar
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
  const limit = 6;
  const from = parseInt(req.query.from) || 0;
  const to = parseInt(req.query.to) || 6;

  // Get videogames based on search query
  let videogames = query === ""
    ? await videogame.getVideogames()
    : await videogame.searchVideogames(query);

  // If it's an AJAX request for infinite scroll (has 'from' parameter)
  if (req.query.from !== undefined) {
    videogames.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = videogames.slice(from, to);
    return res.render("videogames", {
      videogamesAct: result
    });
  }

  // Normal page load - render full page with pagination
  const totalVideogames = videogames.length;
  const totalPages = Math.ceil(totalVideogames / limit);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const videogamesAct = videogames.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({
      number: i,
      isActive: i === page
    });
  }

  // Get random suggested game
  const allVideogames = await videogame.getVideogames();
  let suggestedGame = null;
  if (allVideogames.length > 0) {
    const randomIndex = Math.floor(Math.random() * allVideogames.length);
    suggestedGame = allVideogames[randomIndex];
  }

  // Extract all unique categories for filter sidebar
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


router.get("/videogames", async (req, res) => {
  const from = parseInt(req.query.from) || 0;
  const to = parseInt(req.query.to) || 6;

  const all = await videogame.getVideogames();
  all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const result = all.slice(from, to);

  res.render("videogames", {
    videogamesAct: result
  });
});

