const passport = require('passport');
const axios = require('axios');
const { OAuth2Strategy } = require('passport-oauth');

const boom = require('@hapi/boom');

const { config } = require('../../../config');

//LINKS PARA HACER EL FLUJO DE OAUTH CON GOOGLE
const GOOGLE_AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token';
const GOOGLE_URSERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

//Generacion de estrategia oAuth2.0, le pasamos parametros
const oAuth2Strategy = new OAuth2Strategy({
    authorizationURL: GOOGLE_AUTHORIZATION_URL,
    tokenURL: GOOGLE_TOKEN_URL,
    clientID: config.googleClientId,
    clientSecret: config.googleClientSecret,
    callbackURL: "/auth/google-oauth/callback" //url callback de nuestra API
}, async function(accessToken, refreshToken,profile, callback){ //la estrategia recibe una funcion callback que tiene como parametros
    //AccessToken, refreshToken, profile del usuario y una callback
    //accedemos por medio de axios al endpoint proveedor de autenticacion de nuestro API SERVER
    const {data, status} = axios({
        url: `${config.apiUrl}/api/auth/sign-provider`,
        method: 'post',
        data:{ //datos que enviamos al endpoint los datos profile son los que nos devuelve google
            name: profile.name,
            email: profile.email,
            password: profile.id,
            apiKeyToken: config.apiKeyToken
        }
    });
    //en caso de que no retorne data o se un status distinto de 200, mostramos error
    if(!data || status !== 200){
        return callback(boom.unauthorized(),false);
    }
    return callback(null,data);
});

//Implementamos como oAuth va a definir nuestro profile, por lo que recibe un funcion callback
//que tienen como parametros un accessToken y un funcion done.
oAuth2Strategy.userProfile = function(accessToken,done){
    //llamos a oauth2  y hacemos un GET a la url de google que nos devuelve el perfil
    //pasandole el accessToken una fn callback que tiene como parametros un error y el body
    this.oauth2.get(GOOGLE_URSERINFO_URL,accessToken,(err,body)=>{
        //Si hay un error retornamos con el done el error
        if(err){
            return done(err);
        }

        //hacemos try cathc porque hacemos uso de una funcionalidad de Parse
        try {
            //sacamos del body paseado a json el sub, name y el email
            const {sub,name,email} = JSON.parse(body);
            //construccion del nuevo profile con los datos que sacamos en el paso anterior.
            const profile = {
                id: sub,
                name,
                email
            }

            done(null,profile);

        } catch (parseError) { // si hay error en el parse el done devuelve el error
            done(parseError)
        }
    })
}

//difinimos que passport va a usar nuestra estrategia de oAuth.
passport.use("google-ouath",oAuth2Strategy);
