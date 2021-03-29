const express = require('express');

const { config } = require('./config');

const app = express();

app.use(express.json());

app.post('/auth/sign-in', async function(req,res,next){

});

app.post('/auth/sign-up', async function(req,res,next){

});

app.get('/movies',async function(req,res,next){

});

//Ruta para cuando el usuario quiera agregar una pelicula en su listado desde la aplicación de cliente
app.post('/user-movies', async function(req,res,next){

});

//Ruta para cuando el usuario quiera quitar una pelicula en su listado desde la aplicación de cliente
app.delete('/user-movies/:userMovieId',async function(req,res,next){

});

app.listen(config.port,()=>{
    console.log(`El servidor esta escuchando en http://localhost:${config.port}` );
})