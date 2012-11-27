
// 定数
var DEFAULT_NEW_FILE = 'ファイル名を入力してEnter',
    NICONICO_URL = 'http://live.nicovideo.jp/watch/';
// 変数
var tab,
    headerHeight,
    $header,
    $codingContainer,
    $newFileInput,
    $reloadInput;

/**
 * 初期化
 */
var initialize = function(){
    // タブの設定
    SourceTab.config({'enableEditable':true, 'enableCloseButton':true, 'enableRename':true});
    if (tab === undefined)
        tab = new SourceTab('#coding-container');
    
    // 変数の初期化
    $header = $('#header');
    $codingContainer = $('#coding-container');
    $newFileInput = $('#new-file', $header).val(DEFAULT_NEW_FILE).css('color','#999');
    $reloadInput = $('#reload-iframe', $header).val(NICONICO_URL).css('color','#999');
    headerHeight = $header.height();
    
    initEvent();
},

initEvent = function() {
    // 新規作成
    $('#new-file')
        .focus(function(e) {
            var setVal = ( $(this).val() === DEFAULT_NEW_FILE )
                ? ''
                : $(this).val();
            $(this)
                .on('keyup', handleNewFile)
                .css('color','#333')
                .val(setVal);
        })
        .blur(function(e) {
            var setVal = ( $(this).val() === '' )
                ? DEFAULT_NEW_FILE
                : $(this).val();
            $(this)
                .off('keyup', handleNewFile)
                .css('color','#999')
                .val(setVal);
        });
        
    // 枠の更新
    $('#reload-iframe')
        .focus(function(e) {
            $(this)
                .on('keyup', handleReloadIframe)
                .css('color','#333');
        })
        .blur(function(e) {
            var setVal = ($(this).val().indexOf(NICONICO_URL) !== 0)
                ? NICONICO_URL
                : $(this).val();
            $(this)
                .off('keyup', handleReloadIframe)
                .css('color','#999')
                .val(setVal)
        });
        
    // 同期
    $('#synchronize').click(handleClickSynchronize);
    
    // 保存
    $('#update-save').click(handleClickUpdateSaveFile);
    $('#new-save').click(handleClickNewSaveFile);
    
    // 復元
    $('#load-file').click(handleClickLoadFile);
    
    // ソース入力
    $(document).on('keydown', '.editable-container', handleInputSource);
    
    // リサイズ処理
    $(window).resize(handleResize);
    handleResize();
    
    // タブが閉じた時に発動
    tab.setCloseHandle(function(filename){
        handleSocketCloseFile(filename);
    });
    
     // ファイル名が変更された時に発動
    tab.setRenameHandle(function(oldFilename, newFilename){
        handleSocketRenameFile(oldFilename, newFilename);
    });
};