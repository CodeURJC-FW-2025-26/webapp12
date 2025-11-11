import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';

import * as videogame from './videogame.js';

const router = express.Router();
export default router;

const upload = multer({ dest: videogame.UPLOADS_FOLDER })

router.get('/', async (req, res) => {

    let videogamesAct = await videogame.getVideogames();

    // Seleccionar un videojuego aleatorio como sugerido
    let suggestedGame = null;
    if (videogamesAct.length > 0) {
        const randomIndex = Math.floor(Math.random() * videogamesAct.length);
        suggestedGame = videogamesAct[randomIndex];
    }

    res.render('index', { videogamesAct, suggestedGame });
});

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

router.get('/post/:id/delete', async (req, res) => {

    let post = await videogame.deleteVideogame(req.params.id);

    if (post && post.imageFilename) {
        await fs.rm(videogame.UPLOADS_FOLDER + '/' + post.imageFilename);
    }

    res.render('deleted_videogame');
});

router.get('/post/:id/image', async (req, res) => {

    let post = await videogame.getVideogame(req.params.id);

    res.download(videogame.UPLOADS_FOLDER + '/' + post.imageFilename);

});

router.get('/search', async (req, res) => {
    const query = req.query.q?.toLowerCase() || '';

    let videogames = await videogame.getVideogames();

    let filtered = videogames.filter(v =>
        v.title.toLowerCase().includes(query)
    );

    res.render('index', { videogamesAct: filtered, searchQuery: req.query.q });
});
