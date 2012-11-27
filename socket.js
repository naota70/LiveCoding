exports.connection = function(server) {
    io = require('socket.io').listen(server);
    
    // 設定
    io.configure('production', function(){
        io.enable('browser client minification');
        io.enable('browser client etag');
        io.enable('browser client gzip');
        io.set('log level', 1);
        io.set('transports', [
            'websocket'
          // , 'flashsocket'
          , 'htmlfile'
          , 'xhr-polling'
          , 'jsonp-polling'
        ]);
    });
    
    // イベント
    io.sockets.on('connection', function(socket) {
        // 初期化
        initialize(socket);
        // 新規作成
        socket.on('new-file', function(filename){
            socket.broadcast.emit('new-file', filename);
        });
        // 更新
        socket.on('update-file', function(data){    
            socket.json.broadcast.emit('update-file', data);
        });
        // 閉じる
        socket.on('close-file', function(filename){
            socket.broadcast.emit('close-file', filename);
        });
        // ファイル名の更新
        socket.on('rename-file', function(data){
            handleRename(socket, data);
        });
        // 保存
        socket.on('save-file', function(data){
            handleSave(socket, data);
        });
        // 読み込む
        socket.on('load-file', function() {
            handleOnLoadLatestSource(socket);
        });
        // 埋め込みページの更新
        socket.on('reload-iframe', function(url){
            handleReloadURL(socket, url);
        });
        // 接続解除
        socket.on('disconnect', function(){
            numConnecting--;
            io.sockets.emit('update-viewers', numConnecting);
        });
    });
};

//--------------------------------------
// CLOASERE PROPERTIES
//--------------------------------------
var io
  , numConnecting = 0
  , SourceCode = require('./model').SourceCode
  , BroadCastURL = require('./model').BroadCastURL;
  
//--------------------------------------
// CLOASERE METHODS
//--------------------------------------

var initialize = function(socket) {
    numConnecting++;
    io.sockets.emit('update-viewers', numConnecting);　// 現在同時接続している数を通知
    handleOnLoadLatestSource(socket); // 接続と同時に最新ソースを送る
},

/**
 * ファイル名の更新
 * @param {Object} data
 */
handleRename = function(socket, data){
    socket.broadcast.emit('rename-file', data);
    
    var oldFilename = data.oldFilename,
        newFilename = data.newFilename,
        uniqueId    = data.uniqueId;
    
    // DB更新
    SourceCode.findOne({ _id: uniqueId }, function(error, data){
        
        if (!error) {
            var files = data.files, i = 0, len = files.length;
            
            for (; i < len; i++)
            {
                if (files[i].filename === oldFilename)
                {
                    files[i].filename = newFilename;
                    break;
                }
            }

            SourceCode.update(
                { _id: uniqueId },
                { $set: { 'files': files, 'saveTime': new Date }},
                { upsert:false, multi:true },
                function(error){
                    console.log('ファイル名変更::DB更新', error);
                }
            );
        }
    });
},

/**
 * ファイルの保存
 * @param {Object} data
 */
handleSave = function(socket, data){
        
    if (data.uniqueId === undefined)
    {
        console.log('新規保存');
    
        var source = new SourceCode();    
        source.saveTime = new Date;
        source.files = data.files;
        source.save(function(err){
            socket.emit('save-complete', err);
            
            // uniqueId更新
            console.log('=======', source);
            SourceCode.find({}, null, { sort:{saveTime: -1}, limit:1}, function(error, data){
                if (data._id !== undefined)
                    socket.emit('update-id', data._id);
            });
        });
    }
    else
    {
        console.log('上書き保存');
        SourceCode.update(
            { _id:data.uniqueId },
            { $set: { files: data.files, saveTime: new Date }},
            { upsert:false, multi:true },
            function(err){
                console.log('上書き保存結果', err);
                socket.emit('save-complete', err);
            }
        );
    }
},

/**
 * 埋め込みページの更新
 * @param {String} url
 */
handleReloadURL = function(socket, url){
    console.log('埋め込みページの更新');
    if (typeof url === 'string')
    {
        socket.broadcast.emit('reload-iframe', url);
        
        // DBに保存
        BroadCastURL.find({}, null, {limit:1}, function(err, data){                
            console.log('error:', err, typeof data[0]._id);
            
            if (err) return;
            
            if (data.lenght === 0 || data[0]._id === undefined)
            {
                var broadCastURL = new BroadCastURL();    
                    broadCastURL.url = url;
                    broadCastURL.save(function(err){
                        if (err) console.log(err);
                    });
            }
            else
            {
                BroadCastURL.update(
                    { _id:data[0]._id },
                    { $set: { url: url }},
                    { upsert:false, multi:true },
                    function(err){
                        if (err) console.log(err);
                    }
                );
            }
        });
    }
},

/**
 * ファイルのロード
 * @param {Object} socket
 */
handleOnLoadLatestSource = function(socket) {
    console.log('handleOnLoadLatestSource::データベースに要求');
    SourceCode.find({}, null, { sort:{saveTime: -1}, limit:1}, function(err, data){
        console.log('handleOnLoadLatestSource::データベースからの結果', data);
        var latest = (data['0'] !== undefined)
            ? data['0']
            : {};
            
        socket.json.emit('load-file', latest);
    });
};