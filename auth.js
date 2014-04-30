var config = require('configure')
var passport = require('koa-passport')

var backend = require('./backend')

passport.serializeUser(function(user, done) {
	//console.log('serialize: ' + JSON.stringify(user))
	done(null, user)
})

passport.deserializeUser(function(id, done) {
	//console.log('deserialize: ' + id)
	done(null, JSON.stringify(id))
})

var facebook_strategy_params = {
	clientID: 'your-client-id',
	clientSecret: 'your-secret',
	protocol: 'http',
	host: 'localhost',
	port: 80,
	callbackPath: '/auth/facebook/callback'
}
if (config.facebook.clientID) facebook_strategy_params.clientID = config.facebook.clientID
if (config.facebook.clientSecret) facebook_strategy_params.clientSecret = config.facebook.clientSecret
if (config.protocol) facebook_strategy_params.protocol = config.protocol
if (config.host) facebook_strategy_params.host = config.host
if (config.port) facebook_strategy_params.port = config.port
if (config.facebook.callbackPath) facebook_strategy_params.callbackPath = config.facebook.callbackPath
facebook_strategy_params.callbackURL = facebook_strategy_params.protocol + "://"
	+ facebook_strategy_params.host + ":"
	+ facebook_strategy_params.port
	+ facebook_strategy_params.callbackPath

var FacebookStrategy = require('passport-facebook').Strategy
passport.use(new FacebookStrategy(facebook_strategy_params,
	function(token, tokenSecret, profile, done) {
		backend.user_search('facebook', profile.username, function(err, user_info) {
			if (!user_info.id) {
				backend.user_create('facebook', profile.username, function(err, user_info) {
					done(null, { id: user_info.id, name: user_info.name })
				} )
			} else {
				done(null, { id: user_info.id, name: user_info.name })
			}
		} )
	}
))

