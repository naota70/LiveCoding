
var socket = io.connect('http://' + location.host + '/', {
    // 'reconnect': true,
    // 'reconnection delay': 500,
    'reconnection limit': 5000,
    'max reconnection attempts': 10,
});
var EVENT_NEW_FILE       = 'new-file',
    EVENT_UPDATE_FILE    = 'update-file',
    EVENT_CLOSE_FILE     = 'close-file',
    EVENT_RENAME_FILE    = 'rename-file',
    EVENT_RELOAD_IFRAME  = 'reload-iframe',
    EVENT_LOAD_FILE      = 'load-file',
    EVENT_UPDATE_SAVE    = 'update-save',
    EVENT_NEW_SAVE       = 'new-save',
    EVENT_UPDATE_VIEWERS = 'update-viewers',
    EVENT_DISCONNECT     = 'disconnect',
    EVENT_RECONNECT      = 'reconnect';

// 接続確立
socket.on('connect', function(){
    console.log('connect success');

    // 同時接続数通知の受信イベント
    socket.on(EVENT_UPDATE_VIEWERS, function(num){
        console.log('現在の同時接続数:', num);
    });
    
    // ソースコードの受信イベント
    socket.on(EVENT_LOAD_FILE, function(data){
        
        if (data === undefined || data.files === undefined)
            return;
        if (tab === undefined)
            tab = new SourceTab('#livecoding-container');
        tab.removeAll();
        
        var files = data.files,
            i = 0,
            len = files.length;
            
        for (; i < len; i++)
            tab.update(files[i].filename, files[i].source);
        
        $('#loading', $livecodingContainer).remove();
    });
    
    // ファイルの新規作成
    socket.on(EVENT_NEW_FILE, function(filename){
        tab.add(filename);
    });
    
    // ソースの更新
    socket.on(EVENT_UPDATE_FILE, function(data){
        var filename = data.filename,
            source = data.source,
            highlight = data.highlight,
            lineNumber = data.lineNumber;
        
        console.log('行数:', lineNumber);
        tab.update(filename, source, highlight);
        
        if (lineNumber >= 0 && isMirroring)
        {
            tab.synchronize(filename, lineNumber);
        }
    });
    
    // ファイルを閉じる
    socket.on(EVENT_CLOSE_FILE, function(filename){
        tab.remove(filename);
    });
    
    // ファイル名の変更
    socket.on(EVENT_RENAME_FILE, function(data){
        tab.rename(data.oldFilename, data.newFilename);
    });
    
    // 埋め込みページの更新
    socket.on(EVENT_RELOAD_IFRAME, function(url){
        handleReloadChannel(url);
    });
    
    // 接続解除
    socket.on(EVENT_DISCONNECT, function(){
        console.log('接続が解除されました');
    });
    
    // 再接続
    socket.on(EVENT_RECONNECT, function(){
        socket.emit(EVENT_LOAD_FILE);
    });
    
});