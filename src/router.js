import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';

import * as videogame from './videogame.js';

const router = express.Router();
export default router;

const upload = multer({ dest: videogame.UPLOADS_FOLDER })

router.get('/', async (req, res) => {

    let videogamesAct = await videogame.getVideogames();

    res.render('index', { videogamesAct });
});

router.post('/post/new', upload.single('image'), async (req, res) => {

    let post = {
        user: req.body.user,
        title: req.body.title,
        text: req.body.text,
        imageFilename: req.file?.filename
    };

    await videogame.addVideogame(videogame);

    res.render('saved_Videogame', { _id: post._id.toString() });

});

router.get('/post/:id', async (req, res) => {

    let post = await videogame.getVideogame(req.params.id);

    res.render('show_Videogame', { videogame });
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

