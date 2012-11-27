
//===========================================================
// VARIABLES
//===========================================================

// jQuery周りの変数宣言
var $headerContainer,
    $mainContainer,
    $footerContainer,
    $broadcastContainer,
    $livecodingContainer,
    $handleContainer,
    $broadcastInnerContainer,
    $broadcast,
    $resizeHandle;

var tab,
    isMirroring,// ミラーリング許可
    isManualChange,// ハンドルで幅を変えたか
    isSetting, // 設定の変更中
    isMouseDown,
    minSourceViewWidth,// ライブコーディング画面の最低幅
    centerLineX,// 境界線のX座標
    highlightTarget,//
    footerHeight;
    
    // ヘッダー・フッターの高さの合計
var WITHOUT_MAIN_HEIGHT = 60 + 5 + 5 + 40,

    //localStorageのキー
    LOCAL_STORAGE_KEY = {
        SPLIT_RATE:'splitRate',
        IS_MIRRORING:'isMirroring',
        COLOR_THEME:'colorTheme',
        FONT_SIZE:'fontSize',
        IS_CODE_WRAP:'codeWrap'
    };
    
//===========================================================
// INITIALIZE METHOD
//===========================================================
var initialize = function(){
    // 初期化
    initVariable();
    initVisual();
    initEvent();
    //initDebug();
    initSetting();
    //initSource();
    
    // 初期化の仕上げにリサイズ処理を走らせる
    handleResize();
},

/**
 * 変数の初期化
 */
initVariable = function()
{
    if (tab === undefined)
        tab                      = new SourceTab('#livecoding-container');
    $headerContainer         = $('#header-container');
    $mainContainer           = $('#main-container');
    $footerContainer         = $('#footer-container');
    $broadcastContainer      = $('#broadcast-container', $mainContainer);
    $livecodingContainer     = $('#livecoding-container', $mainContainer);
    $handleContainer         = $('#handle-container', $mainContainer);
    $broadcastInnerContainer = $('#broadcast-inner-container', $broadcastContainer);
    $broadcast               = $('#broadcast', $broadcastInnerContainer);
    $resizeHandle            = $('#resize-handle', $handleContainer);
        
    isMirroring              = true;
    isManualChange           = false;
    isSetting                = false;
    isMouseDown              = false;
    minSourceViewWidth       = 0;
    centerLineX              = 0;
    footerHeight             = 0;
    highlightTarget          = document.getElementById('page-container');
},

/**
 * ローカルストレージのデータを反映
 */
initSetting = function(){
    // 分割率
    var _splitRate = parseInt( localStorage.getItem(LOCAL_STORAGE_KEY.SPLIT_RATE) || '50' );
    handleClickResizeHandle(_splitRate);
    
    // ミラーリング
    var _isMirroring = localStorage.getItem(LOCAL_STORAGE_KEY.IS_MIRRORING) || 'mirroring';
    $('#controler-mirror').addClass(_isMirroring);
    isMirroring = (_isMirroring === 'mirroring') ? true : false;
    
    // カラーテーマ
    var _colorTheme = localStorage.getItem(LOCAL_STORAGE_KEY.COLOR_THEME) || 'default';
    var $colorTheme = $('#theme-config #theme-' + _colorTheme, $footerContainer);
    handleClickTheme({'currentTarget':$colorTheme.get(0)});
    
    // フォントサイズ
    var _fontSize = localStorage.getItem(LOCAL_STORAGE_KEY.FONT_SIZE) || 'medium';
    var $fontSize = $('#font-size-config #font-size-' + _fontSize, $footerContainer);
    handleClickFontsize({'currentTarget':$fontSize.get(0)});
    
    // 折り返し
    var _codeWrap = localStorage.getItem(LOCAL_STORAGE_KEY.IS_CODE_WRAP) || 'on';
    var $codeWrap = $('#text-wrap-config #text-wrap-' + _codeWrap, $footerContainer);
    handleClickTextwrap({'currentTarget':$codeWrap.get(0)});
},

/**
 * 視覚的なDOM操作による初期化
 */
initVisual = function() {
    // ヘッダーのライン
    var headLine = '<div class="line-shadow flow-box" style="top:0px"></div><div class="line-shadow flow-box" style="bottom:0px"></div>';
    $('header', $headerContainer).append(headLine);
    
    // 著作権表記
    var $c = $('#copyrights', $footerContainer);
    $c.css('marginLeft', '-' + parseInt($c.width()/2) + 'px');
    
    // カラーテーマのアイコン
    $('#theme-config li', $footerContainer).prepend('<ul class="color-sample"><li></li><li></li><li></li></ul>');
    
    // コードテーマ
    SyntaxHighlighter.config.strings.expandSource = 'ソース';
    SyntaxHighlighter.config.strings.viewSource = 'ソース表示';
    SyntaxHighlighter.config.strings.copyToClipboard = 'コピー　Clipboard';
    SyntaxHighlighter.config.strings.copyToClipboardConfirmation ='コピー完了';
    SyntaxHighlighter.config.strings.print = 'プリンタ';
    SyntaxHighlighter.config.strings.help = 'SyntaxHighlighter version 2.1.364';
},


/**
 * イベント周りの初期化
 */
initEvent = function() {
    /**
     * リサイズ周りのイベント
     */
    // ハンドルの表示・非表示
    $mainContainer.on('mousemove', toggleResizeHandle);

    // 中央揃え
    $('#handle-resize', $resizeHandle).dblclick(handleDBClickResizeHandle);
    
    // マニュアルで：分割率の調整
    $('#handle-resize', $resizeHandle).on('mousedown', handleDownResizeHandle);
    $('#handle-resize', $resizeHandle).on('mouseup', clearResizeHandleEvent);
    
    // ハンドル：右端と左端へ
    $('#handle-right-most', $resizeHandle).click({'percent':'90'}, handleClickResizeHandle);
    $('#handle-left-most', $resizeHandle).click({'percent':'10'}, handleClickResizeHandle);
    
    /**
     * 設定周りのイベント
     */
    // コミュに入る
    $('#controler-commu', $footerContainer).click(handleClickCommu);
  
    // 情報を表示
    $('#controler-info', $footerContainer).click(handleClickInfo);

    // リロード
    $('#controler-reload', $footerContainer).click(function(){
        handleReloadChannel();
    });
    
    // 設定の変更
    $('#controler-setting, #setting-close', $footerContainer).click(handleClickSetting);    
        
     // 折り返し設定
    $('#text-wrap-config li', $footerContainer).click(handleClickTextwrap);
    
    // フォントサイズの変更
    $('#font-size-config li', $footerContainer).click(handleClickFontsize);
    
    // テーマの変更
    $('#theme-config li', $footerContainer).click(handleClickTheme);
    
    // ミラーリング機能
    $('#controler-mirror', $footerContainer).click(handleClickMirror);

    /**
     * グローバルイベント
     */
    $(window)
        .on('beforeunload', handleSaveLocalStorage) // クローズイベント（※Operaは実装されません）
        .keyup(handleKeyUp) // キーボードイベント
        .resize(handleResize); // リサイズイベント
},

initSource = function() {
    var filename;
    for (var key in files)
    {
        filename = key.replace('___', '.');
        tab.update(filename, files[key]);
    }
},

// デバック用
initDebug = function(){
    $.get("debug/index.html", function(data){
        tab.update('index.ejs', data, [2, 3]);
    });
    
    $.get("stylesheets/common.css", function(data){
        tab.update('stylesheets/style.css', data, [5, 6, 7]);
    });
    
    $.get("stylesheets/shCore.css", function(data){
        tab.update('stylesheets/shCore.css', data, [5, 6, 7]);
    });
    
    setTimeout(function(){
        tab.synchronize('index.ejs', 45);
    }, 3000);
    
    setTimeout(function(){
        $.get("stylesheets/shThemeDefault.css", function(data){
        tab.update('stylesheets/shThemeDefault.css', data, [5, 6, 7]);
    });
    }, 5000);
};