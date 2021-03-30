const passport = require('passport');
const axios = require('axios');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const boom = require('@hapi/boom');

const { config } = require("../../../config/index");

passport.use(new FacebookStrategy({
    clientID: config.facebookClientId,
    clientSecret: config.facebookClientSecret,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  async function(accessToken, refreshToken, profile, callback) {
      console.log(profile);
      const { data, status } = await axios({
        url: `${config.apiUrl}/api/auth/sign-provider`,
        method: "post",
        data: {
            name: profile.displayName,
            email: profile.emails[0].value,
            password: profile.id,
            apiKeyToken: config.apiKeyToken
        }
      });

      if (!data || status !== 200) {
        return callback(boom.unauthorized(), false);
      }

      return callback(null, data);
  }
));