import express from 'express';
import mustacheExpress from 'mustache-express';
import bodyParser from 'body-parser';

import router from './router.js';
import './load_data.js';

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

// Rutas
app.use('/', router);

app.get('/', (req, res)=>{
    res.render('index');
});

app.get('/detail', (req, res)=>{
    res.render('detail');
});

app.get('/create', (req, res)=>{
    res.render('create');
});

app.get('/deleteVideogame', (req, res)=>{
    res.render('deleteVideogame');
});

app.get('/uploadVideogame', (req, res)=>{
    res.render('uploadVideogame');
});



// Iniciar servidor
app.listen(3000, () => console.log('Web ready in http://localhost:3000/'));