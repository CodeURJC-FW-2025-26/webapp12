import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';

import * as videogame from './videogame.js';

const router = express.Router();
export default router;

const upload = multer({ dest: videogame.UPLOADS_FOLDER })

router.post('/post/new', upload.single('image'), async (req, res) => {

    let videogame = {
        user: req.body.user,
        title: req.body.title,
        text: req.body.text,
        imageFilename: req.file?.filename
    };

    await videogame.addVideogame(videogame);

    res.render('saved_Videogame', { _id: videogame._id.toString() });

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

    let videogamesAct;
    if (query === "") {
        videogamesAct = await videogame.getVideogames();
    } else {
        videogamesAct = await videogame.searchVideogames(query);
    }

    const allVideogames = await videogame.getVideogames();

    let suggestedGame = null;
    if (allVideogames.length > 0) {
        const randomIndex = Math.floor(Math.random() * allVideogames.length);
        suggestedGame = allVideogames[randomIndex];
    }

    res.render('index', { 
        videogamesAct, 
        suggestedGame,
        searchQuery: query
    });
});

