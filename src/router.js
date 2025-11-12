import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';

import * as videogame from './videogame.js';

const router = express.Router();
export default router;

const upload = multer({ dest: videogame.UPLOADS_FOLDER })

/*router.post('/post/new', upload.single('image'), async (req, res) => {

    let videogame = {
        user: req.body.user,
        title: req.body.title,
        text: req.body.text,
        imageFilename: req.file?.filename
    };

    await videogame.addVideogame(videogame);

    res.render('saved_Videogame', { _id: videogame._id.toString() });

});*/


router.post('/post/new', upload.single('image'), async (req, res) => {
    const videogameData = {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        platform: req.body.platform,
        year: req.body.year,
        developer: req.body.developer,
        categories: Array.isArray(req.body.genres) ? req.body.genres : [req.body.genres],
        imageFilename: req.file?.filename || null,
        trailer: req.body.trailer,
        createdAt: new Date()
    };

    

    const result = await videogame.addVideogame(videogameData);

    console.log('Insertado en MongoDB:', result);

    res.render('uploadVideogame', { _id: result.insertedId.toString() });


});


router.get('/detail/:id', async (req, res) => {
    const game = await videogame.getVideogame(req.params.id);
  
    if (!game) {
      return res.status(404).send('Videojuego no encontrado');
    }
  
    res.render('detail', game);
  });

router.get('/detail/:id/deleteVideogame', async (req, res) => {

    let idGame = await videogame.deleteVideogame(req.params.id);

    if (idGame && idGame.imageFilename) {
        await fs.rm(videogame.UPLOADS_FOLDER + '/' + idGame.imageFilename);
    }

    res.render('deleteVideogame', idGame);

});


router.get('/post/:id/image', async (req, res) => {

    let post = await videogame.getVideogame(req.params.id);

    res.download(videogame.UPLOADS_FOLDER + '/' + post.imageFilename);

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

    res.render('index', {
        videogamesAct,
        suggestedGame,
        currentPage: page,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
        prevPage: page - 1,
        nextPage: page + 1,
        pages
    });
});

