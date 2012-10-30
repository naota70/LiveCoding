
/**
 * Module dependencies.
 */

var port = 8124
	, express = require('express')
	, routes = require('./routes')
	, user = require('./routes/user')
	, http = require('http')
	, path = require('path')
	, io = require('socket.io').listen(port);

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/admin', function(req, res){
	res.render('admin', {});
});
app.get('/users', user.list);

http.createServer(app).listen(3000, function(){
  console.log("Express server listening on port " + app.get('port'));
});

// socket.io
io.sockets.on('connection', function(socket) {
	console.log('connect');
	
	// 自分を以外の全クライアントにブロードキャストする
	socket.on('updateCode', function(data){
		// 自分を含む全クライアントにブロードキャストする
		socket.broadcast.emit('sendingCode', data);
	});
	
	socket.on('disconnect', function(){
		console.log('disconnect');
	});
});