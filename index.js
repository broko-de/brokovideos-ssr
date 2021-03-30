const express = require('express');
const passport = require('passport');
//para definir como manejamos la session para la autenticacion con Twitter
const session = require('express-session');
const boom = require('@hapi/boom');
//Libreria para 
const cookieParser = require('cookie-parser');
const axios = require('axios');

const { config } = require('./config');

const app = express();

app.use(express.json());
app.use(cookieParser());
//implementamos la session con el secret que va a codificar
app.use(session({secret: config.sessionSecret}));
//para inicializar la session
app.use(passport.initialize());
app.use(passport.session());

// para usar la estretegia Basic
require('./utils/auth/strategies/basic')

//para usar la estragia OAuth con google
require('./utils/auth/strategies/oauth');

//para usar la estragia OAuth con twitter
require('./utils/auth/strategies/twitter');

//para usar la estragia OAuth con facebook
require('./utils/auth/strategies/facebook');

const THIRTY_DAYS_IN_SEC = 2592000;
const TWO_HOURS_IN_SEC = 7200;

app.post('/auth/sign-in', async function(req,res,next){
    const { rememberMe } = req.body;

    //implementacion de estrategia basic
    passport.authenticate("basic",function(error,data){
        try {
            //si nuestra estregia basica fallo
            if(error || !data){
                next(boom.unauthorized());
            }

            //llammos al requets de login, donde la sesion es false porque no se maneja estados y una fn callback
            req.login(data,{session: false}, async function(error){
                if(error){
                    next(error);
                }

                const {token,...user} = data;

                //definimos una cookie token en la respuesta
                //En produccion la cookie tiene que ser accedida por http (mendiante un server) y tiene que ser segura por medio de https
                //En desarrollo podemos manipularla tranquilamente
                //Si el atributo rememberMe es verdadero la expiracoin será de 30 días
                //de lo contrario l expiración sera en 2 horas.
                res.cookie("token", token,{
                    httpOnly: !config.dev, //config.dev devuelve true si el entorno es desarrollo y false si es produccion
                    secure: !config.dev,
                    maxAge: rememberMe ? THIRTY_DAYS_IN_SEC: TWO_HOURS_IN_SEC 
                });

                //devolvemos en la respuesta al usuario
                res.status(200).json(user);
            });
        } catch (error) {
            next(error);
        }
    })(req,res,next); //Authenticate debe ejecutarse con req, res y next
});

app.post('/auth/sign-up', async function(req,res,next){
    const {body:user} = req;

    try {
        await axios({
            url: `${config.apiUrl}/api/auth/sign-up`,
            method:post,
            data:user
        });
        res.status(200).json({
            message:'Usuario fue creado'
        })
    } catch (error) {
        next(error);
    }

});

app.get('/movies',async function(req,res,next){

});

//Ruta para cuando el usuario quiera agregar una pelicula en su listado desde la aplicación de cliente
app.post('/user-movies', async function(req,res,next){
    try {
        //saco el userMovie del body de la request;
        const {body:userMovie} = req;
        //obtengo el token de la cookie de la petición para poder hacer request al API SERVER
        const {token} = req.cookies;

        //hacemos la llamada a nuestro API SERVER para  crear la user-movie
        //En la cabecera de la peticion enviamos el token por medio de authorization bearer
        //le enviamos la data del userMovie que queremos crear
        const {data,status} = await axios({
            url: `${condif.apiUrl}/api/user-movies`,
            headers: {Authorization: `Bearer ${token}`},
            method: 'post',
            data: userMovie
        });

        //Si el server no devuelve un 201 respondemos con un badImplementation
        if (status !== '201'){
            return next(boom.badImplementation());
        }

        //respondemos ok y la data del API-SERVER
        res.status(201).json(data);

    } catch (error) {
        next(error)
    }
});

//Ruta para cuando el usuario quiera quitar una pelicula en su listado desde la aplicación de cliente
app.delete('/user-movies/:userMovieId',async function(req,res,next){
    try {
        //saco el userMovieId de los parametros de la request;
        const {userMovieId} = req.params;
        //obtengo el token de la cookie de la petición para poder hacer request al API SERVER
        const {token} = req.cookies;

        //hacemos la llamada a nuestro API SERVER para  borrar la user-movie
        //En la cabecera de la peticion enviamos el token por medio de authorization bearer
        //le enviamos la data del userMovie que queremos crear
        const {data,status} = await axios({
            url: `${condif.apiUrl}/api/user-movies/${userMovieId}`,
            headers: {Authorization: `Bearer ${token}`},
            method: 'delete',
        });

        //Si el server no devuelve un 200 respondemos con un badImplementation
        if (status !== '200'){
            return next(boom.badImplementation());
        }

        //respondemos ok y la data del API-SERVER
        res.status(200).json(data);

    } catch (error) {
        next(error)
    }

});

//Endpoint que se encarga de iniciar el proceso de autenticacion con google
app.get("/auth/google-oauth", 
    //implementa passport con la strategia de google oauth y le especificamos los scopes que va a utilizar    
    passport.authenticate("google-oauth",{
        scope: ['email','profile','openid']
    })
);

//implementamos tambien nuestra ruta callback a la que la autenticación de google va a responder
app.get("/auth/google-oauth/callback", 
    //tambien especificamos que usaremos la estrategia de google, que la sessión sera false por no usar estados
    // y una funcion callback de rutas
    passport.authenticate("google-oauth",{session: false}),
    function(req,res,next){
        //verificamos que el usuario exista  de lo que nos devuelve google
        if(!req.user){
            next(boom.unauthorized());
        }
        //Si existe scamos el token y usuario de la petición
        const {token, ...user} = req.user;

        //creamos un cookie token que contendra el accessToken que recibimos.
        res.cookie("token",token,{
            httpOnly: !config.dev,
            secure: !config.dev
        });
        res.status(200).json(user);

    }
);

//Ruta para hacer la conexión de login con twitter
app.get("/auth/twitter", passport.authenticate("twitter"));

//Ruta de callback una vez que twitter se conecto con exito
app.get("/auth/twitter/callback", passport.authenticate("twitter",{session: false}),
    function(req,res,next){
        if(!req.user){
            next(boom.unauthorized());
        }

        const {token, ...user} = req.user;

        res.cookie("token", token,{
            httpOnly: !config.dev,
            secure: !config.dev
        })

        res.status(200).json({user})
    }
);

app.get("/auth/facebook", passport.authenticate("facebook", {
        scope: ["email"]
    })
);
  
app.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", { session: false }),
    function(req, res, next) {
      if (!req.user) {
        next(boom.unauthorized());
      }
  
      const { token, ...user } = req.user;
  
      res.cookie("token", token, {
        httpOnly: !config.dev,
        secure: !config.dev
      });
  
      res.status(200).json(user);
    }
  );



app.listen(config.port,()=>{
    console.log(`El servidor esta escuchando en http://localhost:${config.port}` );
})