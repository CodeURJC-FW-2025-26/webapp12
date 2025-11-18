import express from 'express';
import mustacheExpress from 'mustache-express';
import bodyParser from 'body-parser';

import router from './router.js';
import './load_data.js';
import * as videogame from './videogame.js'; // ← AÑADE ESTA LÍNEA


const app = express();

// Servir archivos estáticos desde 'public'
app.use(express.static('./public'));

app.use('/uploads', express.static('uploads'));


// Configurar Mustache como motor de plantillas
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', './views');

// Middleware para formularios
app.use(bodyParser.urlencoded({ extended: true }));

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

    // Hacer allCategories disponible para TODAS las vistas
    res.locals.allCategories = allCategories;
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.locals.allCategories = [];
  }
  next();
});

// Rutas
app.use('/', router);

app.get('/', (req, res)=>{
    res.render('index');
});

app.get('/detail', (req, res)=>{
    res.render('detail');
});

app.get('/create', (req, res)=>{

  const allGenres = [
    'RPG', 'Shooter', 'Creativo', 'Estrategia', 'Bélico',
    'Acción', 'Carreras', 'MOBA', 'Sandbox', 'Mundo Abierto', 'Simulación', 'Supervivencia'
  ];

  const genresWithFlags = allGenres.map(genre => ({
    name: genre,
    checked: '' // Ninguna marcada en modo creación
  }));

  res.render('create', {
    genresWithFlags
  });

});



// Iniciar servidor
app.listen(3000, () => console.log('Web ready in http://localhost:3000/'));