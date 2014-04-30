var config = require('configure')
var koa = require('koa')
var app = koa()
var parse = require('co-body')
var serve = require('koa-static')

var session = require('koa-session')
app.keys = ['your-session-secret']
app.use(session())

require('./auth')
var passport = require('koa-passport')
app.use(passport.initialize())
app.use(passport.session())

var backend = require('./backend')

var views = require('koa-render')
app.use(views('./views', {
	map: { html: 'handlebars' },
	cache: false
}))

var Router = require('koa-router')
var public = new Router()

public.get('/', function*() {
	//console.log('> ' + JSON.stringify(this.session))
	this.redirect('/-/' + config.mainpage)
})

public.get('/-/', function*() {
	this.redirect('/-/' + config.mainpage)
})

public.get('/-/:name', function*() {
	if (this.params.name == ':') {
		this.redirect('/-/' + config.mainpage)
	}
	var result = yield backend.article_search(this.params.name)
	if (result.content) result.content = result.content.replace(/\n/g, '<br>')
	this.body = yield this.render('main', {
		user: this.session.passport.user,
		logined: this.req.isAuthenticated(),
		article: result
	} )
})

public.get('/edit/:name', function*() {
	var result = yield backend.article_search(this.params.name)
	this.body = yield this.render('edit', {
		user: this.session.passport.user,
		logined: this.req.isAuthenticated(),
		article: result
	} )
})

public.post('/edit/:name', function*() {
	var body = yield parse(this, { limit: '1kb' })
	var success = yield backend.article_save(this.params.name, body.content, this.session.passport.user.id)
	this.redirect('/-/' + this.params.name)
})

public.get('/delete/:name', function*() {
	var result = yield backend.article_remove(this.params.name)
	this.redirect('/-/' + this.params.name)
})

public.get('/logout', function*(next) {
	this.req.logout()
	this.redirect('/')
})

public.get('/auth/facebook', passport.authenticate('facebook'))

public.get('/auth/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect: '/',
		failureRedirect: '/'
	})
)

app.use(public.middleware())
app.use(serve('static'))

/*
app.use(function*(next) {
	if (this.req.isAuthenticated()) {
		yield next
	} else {
		this.redirect('/')
	}
})

var secured = new Router()

secured.get('/app', function*() {
	//console.log('> ' + JSON.stringify(this.session))
	this.body = yield this.render('app')
})

app.use(secured.middleware())
*/

var port = 80
if (config.port) port = config.port
app.listen(port)

