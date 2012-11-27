
var handleKeyUp = function(e){
    switch(e.keyCode){
        case 38://up:設定の開閉
        case 40://down
            e.preventDefault();
            handleClickSetting();
            break;
        case 77://M:ミラーリングのON/OFF
            e.preventDefault();
            handleClickMirror(e);
            break;
        case 82://R:ニコ生のリロード
            e.preventDefault();
            handleReloadChannel();
            break;
    }
},

handleClickInfo = function(){
    alert('まだ未実装だお... (´・ω・｀)');
},

handleClickCommu = function(){
    var blankWindow = window.open();
    blankWindow.location.href = 'http://com.nicovideo.jp/motion/co1251273';
},

handleClickSetting = function(){
    isSetting = !isSetting;
    $('#controler-setting p', $footerContainer).text( (isSetting) ? '設定の終了' : '設定の変更' );
    footerHeight = (isSetting) ? 120 : 0;
    
    var mainHeight = $(window).height() - WITHOUT_MAIN_HEIGHT - footerHeight;
    
    // $($handleContainer.selector +',' + $livecodingContainer.selector).animate({'height': mainHeight + 'px'}, 100);
    // $broadcastInnerContainer.animate({'height': mainHeight - 10 + 'px'}, 100);
    $($handleContainer.selector +',' + $livecodingContainer.selector).css('height', mainHeight);
    $broadcastInnerContainer.css('height', mainHeight - 10);
    tab.refreshPage();
},

handleClickMirror = function(e) {
    var $mirror = $('#controler-mirror', $footerContainer);
    
    if ($mirror.attr('class') === 'mirroring')
    {
        isMirroring = false;
        $mirror.attr('class', '');
    }
    else
    {
        isMirroring = true;
        $mirror.attr('class', 'mirroring');
    }
},

handleClickTheme = function(e){
    var self = e.currentTarget;
    if ($(self).attr('class') === 'active') return;

    $('#theme-config li.active', $footerContainer).removeClass('active');
    $(self).addClass('active');
    
    var sourcePath = 'stylesheets/';
    var txt = $(self).text() || 'default';
    switch( txt )
    {
        case 'Django':
            sourcePath += 'shThemeDjango.css'
            break;
        case 'Eclipse':
            sourcePath += 'shThemeEclipse.css'
            break;
        case 'Emacs':
            sourcePath += 'shThemeEmacs.css'
            break;
        case 'FadeToGrey':
            sourcePath += 'shThemeFadeToGrey.css'
            break;
        case 'Midnight':
            sourcePath += 'shThemeMidnight.css'
            break;
        case 'RDark':
            sourcePath += 'shThemeRDark.css'
            break;
        default:// Default
            sourcePath += 'shThemeDefault.css'
            break;
    }
    
    $('#currentTheme').attr('href', sourcePath);
},

handleClickFontsize = function(e){
    var self = e.currentTarget;
    if ($(self).attr('class') === 'active') return;

    $('#font-size-config li.active', $footerContainer).removeClass('active');
    $(self).addClass('active');
    
    var fontSize = '';
    switch( $(self).text() )
    {
        case '小':
            fontSize = '11px';
            break;
        case '大':
            fontSize = '20px';
            break;
        default:// 中
            fontSize = '15px';
            break;
    }
    $livecodingContainer.css('fontSize', fontSize);
},

handleClickTextwrap = function(e){
    var self = e.currentTarget;
    if ($(self).attr('class') === 'active') return;
    
    $('#text-wrap-config li.active', $footerContainer).removeClass('active');
    var id = $(self).addClass('active').attr('id') || 'text-wrap-on';

    var whiteSpace = '.line{white-space:';
    $('#inline-syle').text(whiteSpace += (id.split('-')[2] === 'on') ? 'normal;}' : 'pre;}');
},

handleDownResizeHandle = function(e){
    e.preventDefault();
    // $broadcast.hide();
    $livecodingContainer.addClass('non-select');
    $mainContainer.off('mousemove', toggleResizeHandle);
    $('body').on('mousemove', handleMoveBorder);
    $('body').on('mouseup', clearResizeHandleEvent);
    isMouseDown = true;
},

handleDBClickResizeHandle = function(e){
    e.preventDefault();        
    $($broadcastContainer.selector +','+$livecodingContainer.selector).css('width', '50%');
    handleResizeOnlyVertivally();
    isManualChange = false;
    isMouseDown = false;
},

/**
 * @param {EventObject or Integer}
 */
handleClickResizeHandle = function(e){
    var percent = parseInt( (typeof e === 'object') ? e.data.percent : e );
    $broadcastContainer.css('width', percent + '%');
    $livecodingContainer.css('width', 100 - percent + '%');
    handleResizeOnlyVertivally();
    toggleResizeHandle();
},

/**
 * iframeのリロード
 */
handleReloadChannel = function(newSrc) {
    newSrc = newSrc || $broadcast.attr('src');
    var $icon = $('#controler-reload > .icon', $footerContainer),
        STEP = 24,
        LIMIT = 360 / STEP * 3,
        i = 0,
        // アイコンの回転
        s = setInterval(function(){
            i++
            $icon.css('transform', 'rotate('+ i*STEP +'deg)');            
            if (i > LIMIT)
            {
                clearInterval(s);
                $icon.css('transform', 'rotate(0deg)');   
            }
        }, 50);
    
    // 要素の差し替え
    $broadcastInnerContainer.html(
        '<iframe id="broadcast" class="flow-box" src="' + newSrc + '" name="broadcast"></iframe>'
    );
    
    handleResize();
},

/**
 * ローカルストレージに設定を保存する
 */
handleSaveLocalStorage = function(){
    // localStorage.clear();
    
    // 分割率
    var splitRate = Math.round( $broadcastContainer.width() / $mainContainer.width() *100 );
    localStorage.setItem(LOCAL_STORAGE_KEY.SPLIT_RATE, splitRate);
    
    // ミラーリング
    var isMirroring = $('#controler-mirror').attr('class') || 'non-mirror';
    localStorage.setItem(LOCAL_STORAGE_KEY.IS_MIRRORING, isMirroring);
    
    // カラーテーマ
    var activeThemeId = $('#theme-config .active', $footerContainer).attr('id').split('-')[1];
    localStorage.setItem(LOCAL_STORAGE_KEY.COLOR_THEME, activeThemeId);
    
    // フォントサイズ
    var activeFontId = $('#font-size-config .active', $footerContainer).attr('id').split('-')[2];
    localStorage.setItem(LOCAL_STORAGE_KEY.FONT_SIZE, activeFontId);
        
    // 折り返し
    var activeWrapId = $('#text-wrap-config .active', $footerContainer).attr('id').split('-')[2];
    localStorage.setItem(LOCAL_STORAGE_KEY.IS_CODE_WRAP, activeWrapId);
    
    for (var key in LOCAL_STORAGE_KEY)
    {
        console.log(localStorage[key]);
    }
};
