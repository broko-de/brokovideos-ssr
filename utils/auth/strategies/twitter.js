const passport = require('passport');
const axios = require('axios');
//Se usa para simplificar el manejo y edición de objetos, arrays, etc. ya que este proporciona muchos métodos de utilidad para hacerlo.
const { get } = require('lodash');

const boom = require('@hapi/boom');

const { Strategy: TwitterStrategy } = require('passport-twitter');

const  { config }= require('../../../config');

//Definimos nuestra estrategia de autenticacion con twiter pasandole los parametros 
//Twitter para su autenticacion utilizar oAuth 1.0
passport.use(
    new TwitterStrategy({
        consumerKey: config.twitterConsumerKey,
        consumerSecret: config.twitterConsumerSecret,
        callbackURL: "/auth/twitter/callback",
        includeEmail: true //indicamos que incluya el correo
    }, async function(token, tokenSecret,profile, callback){
        //hacemos la llamada a nuestros API SERVER para crear u obtener los datos del usuario mandandole la info que nos provee twitter
        const { data, status} = await axios({
            url: `${config.apiUrl}/api/auth/sign-provider`,
            method: 'post',
            data:{
                name: profile.displayName,
                email: get(profile,'emails.0.value',`${profile.username}@twitter.com`),
                password: profile.id,
                apiKeyToken: config.apiKeyToken
            }
        })

        if(!data || status!==200){
            return callback(boom.unauthorized(),false);
        }

        return callback(null,data);
    })
);