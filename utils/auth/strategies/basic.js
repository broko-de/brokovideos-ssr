//CREAMOS NUESTRA ESTRATEGIA DE AUTENTICACION BASIC
const passport = require('passport');
const { BasicStrategy } = require('passport-http');
// Libreria para manejo de errores
const boom = require('@hapi/boom');
// libreria que nos permite hacer request a otros servidores - nuestro API SERVER
const axios = require('axios');
//configuracion para acceder a variables de entorno
const { config } = require('../../../config/index');

//DEFINIMOS LA ESTRATEGIA
passport.use(
    new BasicStrategy(async function(email, password,callback){
        try {
            const { data, status} = await axios({
                url: `${config.apiUrl}/api/auth/sign-in`,
                method: 'post',
                //cuerpo de auth de la peticion - estos datos llegarían del frontend
                auth:{
                    password,
                    username:email
                },
                // en el cuerpo se envia la apikeytoken para que nos devuelva un token con los scopes del usuario
                data:{
                    apiKeyToken: config.apiKeyToken
                }
            });
            //si no existe el data de la petición o no recibimos un codigo 200 de status OK, retornamos error
            if(!data || status !== 200){
                return callback(boom.unauthorized(),false);
            }
            //retornamos los datos del scope.
            return callback(null,data);
        } catch (error) {
            callback(error);
        }
    })
)
