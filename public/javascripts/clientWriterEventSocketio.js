var socket = io.connect('http://' + location.host + '/', {
    // 'reconnect': true,
    // 'reconnection delay': 500,
    'reconnection limit': 5000,
    'max reconnection attempts': 10,
});
var uniqueId             = '';
var EVENT_UPDATE_VIEWERS = 'update-viewers',
    EVENT_NEW_FILE       = 'new-file',
    EVENT_UPDATE_FILE    = 'update-file',
    EVENT_CLOSE_FILE     = 'close-file',
    EVENT_RENAME_FILE    = 'rename-file',
    EVENT_RELOAD_IFRAME  = 'reload-iframe',
    EVENT_LOAD_FILE      = 'load-file',
    EVENT_SAVE           = 'save-file',
    EVENT_SAVE_COMPLETE  = 'save-complete',
    EVENT_DISCONNECT     = 'disconnect',
    EVENT_RECONNECT      = 'reconnect',
    EVENT_UPDATE_ID      = 'update-id';
    
// 接続確立
socket.on('connect', function(){
    console.log('connect success');
});

// ソースコードの受信イベント
socket.on(EVENT_LOAD_FILE, function(data){
    console.log(data);
    if (data === undefined || data.files === undefined)
        return;
    
    if (tab === undefined)
        tab = new SourceTab('#coding-container');        
    tab.removeAll();
    
    var files = data.files,
        i = 0,
        len = files.length;
        
    for (; i < len; i++)
        tab.update(files[i].filename, files[i].source);
    
    uniqueId = data._id;
});

// 同時接続数通知の受信イベント
socket.on(EVENT_UPDATE_VIEWERS, function(num){
    console.log('現在の同時接続数:', num);
});

socket.on(EVENT_SAVE_COMPLETE, function(error){
    console.log(error);
    (error === undefined || error === null || error === {})
        ? alert('正常に保存しました。')
        : alert('保存に失敗しました。');
});

// 接続解除
socket.on(EVENT_DISCONNECT, function(){
    console.log('接続が解除されました');
});

// 再接続
socket.on(EVENT_RECONNECT, function(){
    console.log('再接続しました');
    alert('再接続しました。\nソースを一度DBに保存してください');
});

socket.on(EVENT_UPDATE_ID, function(id){
    console.log('ID更新', uniqueId, id);
    uniqueId = id;
});


/**
 * ソースの作成
 * @param {String} filename
 */
var handleSocketNewFile = function(filename) {
    socket.emit(EVENT_NEW_FILE, filename);
},

/**
 * ソースの同期
 * @param {String} filename
 */
handleSocketUpdateFile = function(filename, source, highlight, lineNumber) {
    socket.json.emit(EVENT_UPDATE_FILE, {
        'filename':filename,
        'source':source,
        'highlight':highlight,
        'lineNumber':lineNumber
    });
},

/**
 * ソースの削除
 * @param {String} filename
 */
handleSocketCloseFile = function(filename) {
    socket.emit(EVENT_CLOSE_FILE, filename);
},

/**
 * ソース名の変更
 * @param {String} oldFilename
 * @param {String} newFilename
 */
handleSocketRenameFile = function(oldFilename, newFilename) {
    // DB更新有り
    socket.json.emit(EVENT_RENAME_FILE, {
        'oldFilename':oldFilename,
        'newFilename':newFilename,
        'uniqueId':uniqueId
    });
},

/**
 * ソースの新規保存
 */
handleNewSaveFile = function() {
    var files = convertFiles();    
    socket.emit(EVENT_SAVE, {
        'files': files,
    });
},

/**
 * ソースの上書き保存
 */
handleUpdateSaveFile = function() {
    var files = convertFiles();    
    socket.emit(EVENT_SAVE, {
        'files': files,
        'uniqueId':uniqueId
    });
},

/**
 * @return {Object} files
 */
convertFiles = function() {
    var rawfiles = tab.getAllSources(),
        files = [];
    
    for (var key in rawfiles)
    {
        var file = {
            'filename':key,
            'source':rawfiles[key]
        };
        files.push(file);
    }
    
    return files;
}

/**
 * ソースの復元
 */
handleLoadFile = function() {
    socket.emit(EVENT_LOAD_FILE);
},

/**
 * 埋め込みサイトの更新
 * @param {String} url
 */
handleSocketReloadURL = function(url) {
    // DB保存有り
    socket.emit(EVENT_RELOAD_IFRAME, url);
};