var config = require('configure')
var mysql = require('mysql')
var util = require('./util')

var db_params = {
	host: 'localhost',
	user: 'root',
	password: '****',
	database: 'widuck'
}
if (config.mysql.host) db_params.host = config.mysql.host
if (config.mysql.user) db_params.user = config.mysql.user
if (config.mysql.password) db_params.password = config.mysql.password
if (config.mysql.database) db_params.database = config.mysql.database

var db_conn = mysql.createConnection(db_params)
db_conn.connect()

function article_search(name) {
	return function(callback) {
		var ret = util.parse_name(name)
		var ns = ret[0]
		var title = ret[1]
		db_conn.query('select content, user_id, name as user_name, mod_time from article a join user u on a.user_id = u.id where ns = ? and title = ?', [ns, title], function(err, rows) {
			if (rows.length) {
				callback(null, { pagename: name, ns: ns, title: title, content: rows[0].content, user_id: rows[0].user_id, user_name: rows[0].user_name, mod_time: rows[0].mod_time })
			} else {
				callback(null, { pagename: name, ns: ns, title: title, content: null })
			}
		} )
	}
}

function article_save(name, content, user_id) {
	return function(callback) {
		var ret = util.parse_name(name)
		var ns = ret[0]
		var title = ret[1]
		db_conn.query('select content, user_id, name as user_name, mod_time from article a join user u on a.user_id = u.id where ns = ? and title = ?', [ns, title], function(err, rows) {
			if (rows.length) {
				db_conn.query('update article set content = ?, user_id = ?, mod_time = now() where ns = ? and title = ?', [content, user_id, ns, title], function(err, rows) {
					callback(null, null)
				} )
			} else {
				db_conn.query('insert into article (ns, title, content, user_id, mod_time) values (?, ?, ?, ?, now())', [ns, title, content, user_id], function(err, rows) {
					callback(null, null)
				} )
			}
		} )
	}
}

function article_remove(name) {
	return function(callback) {
		var ret = util.parse_name(name)
		var ns = ret[0]
		var title = ret[1]
		db_conn.query('delete from article where ns = ? and title = ?', [ns, title], function(err, rows) {
			callback(null, null)
		} )
	}
}

function user_create(media, media_username, callback) {
	var user_info = { id: null, name: media_username }
	db_conn.query('insert into user (name) values (?)', [media_username], function(err, result) {
		user_info.id = result.insertId
		db_conn.query('insert into social_media (user_id, media, media_username) values (?, ?, ?)', [result.insertId, media, media_username], function(err, result) {
			return callback(null, user_info)
		} )
	} )
}

function user_search(media, media_username, callback) {
	db_conn.query('select id, name from user where id in (select user_id from social_media where media = ? and media_username = ?)', [media, media_username], function(err, rows) {
		if (rows.length) return callback(null, { id: rows[0].id, name: rows[0].name } )
		else return callback(null, { id: null, name: null } )
	} )
}

module.exports.article_search = article_search
module.exports.article_save = article_save
module.exports.article_remove = article_remove
module.exports.user_create = user_create
module.exports.user_search = user_search

