import express from 'express';
import mustacheExpress from 'mustache-express';
import bodyParser from 'body-parser';

import router from './router.js';
import './load_data.js';
import * as videogame from './videogame.js'; // Videogame data access functions

// Application setup
const app = express();

// Serve static assets
app.use(express.static('./public'));

app.use('/uploads', express.static('uploads'));

// Configure Mustache template engine
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', './views');

// Middleware to forms
app.use(bodyParser.urlencoded({ extended: true }));

// Populate categories for all views (navigation usage)
app.use(async (req, res, next) => {
  try {
    const allVideogames = await videogame.getVideogames();
    const categorySet = new Set();
    allVideogames.forEach(g => {
      if (g.categories) {
        g.categories.forEach(c => categorySet.add(c));
      }
    });
    const allCategories = Array.from(categorySet).sort();

    // Do allCategories for all views
    res.locals.allCategories = allCategories;
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.locals.allCategories = [];
  }
  next();
});

// Mount main router
app.use('/', router);

// Basic direct routes 
app.get('/', (req, res) => res.render('index'));
app.get('/detail', (req, res) => res.render('detail'));

app.get('/create', (req, res) => {
  const allGenres = [
    'RPG', 'Shooter', 'Creativo', 'Estrategia', 'Bélico',
    'Acción', 'Carreras', 'MOBA', 'Sandbox', 'Mundo Abierto', 'Simulación', 'Supervivencia'
  ];

  const genresWithFlags = allGenres.map(genre => ({
    name: genre,
    checked: '' // None pre-selected
  }));

  res.render('create', {
    genresWithFlags
  });

});

// Start server
app.listen(3000, () => console.log('Web ready at http://localhost:3000/'));