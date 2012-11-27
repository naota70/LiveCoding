/**
 * 幅高さのリサイズイベント
 */
var handleResize = function() {
    
    var mainHeight = $(window).height() - WITHOUT_MAIN_HEIGHT - footerHeight,
        windowWidth = $(window).width(),
        bodyOverFlowX = $('body').css('overflowX');
    
    // ハンドルにより分割率を変更していた場合、最初だけ%表記に直す
    if (isManualChange)
    {
        isManualChange = false;
        var percent = parseInt($broadcastContainer.width() / windowWidth * 100);
        $broadcastContainer.css('width', percent + '%');
        $livecodingContainer.css('width', 100 - percent + '%');
    }
    
    // 横スクロールを通常状態ではhiddenにしておく
    if (windowWidth <= 1024 && bodyOverFlowX === 'hidden')
    {
        $('body').css('overflowX', 'scroll');
    }
    else if (windowWidth > 1024 && bodyOverFlowX === 'scroll')
    {
        $('body').css('overflowX', 'hidden');
    }
    
    centerLineX = $broadcastContainer.width();
    
    $broadcastInnerContainer.css({
        'height': mainHeight - 10 + 'px',
        'width': centerLineX - 10 + 'px'
    });
    
    $livecodingContainer.css('height', mainHeight);
    tab.refreshTab(false);
    
    $handleContainer.css({
        'height': mainHeight + 'px',
        'left': centerLineX - 6 + 'px'
    });
    
    $resizeHandle.css('marginTop', parseInt( (mainHeight - 126) / 2 ));
},

/**
 * 横幅のみのリサイズイベント
 */
handleResizeOnlyVertivally = function(){
    isManualChange = true;
    centerLineX = $broadcastContainer.width();
    
    $broadcastInnerContainer.css(
        'width', centerLineX - 10 + 'px'
    );

    $handleContainer.css(
        'left', centerLineX - 6 + 'px'
    );
    
    tab.refreshTab(false);
},





//===========================================================
// RESIZE HANDLE METHODS
//===========================================================

/**
 * 境界線の移動イベント
 * @param {Object} MouseEventObject
 */
handleMoveBorder = function(e) {
    e.preventDefault();
    var windowWidth = $(document).width(),
        pageX = e.pageX;
    
    if (windowWidth - pageX > minSourceViewWidth)
    {
        $broadcastContainer.css('width', pageX + 'px');
        $livecodingContainer.css('width', windowWidth - pageX + 'px');
        handleResizeOnlyVertivally();
    }
},

/**
 * リサイズハンドルの表示非表示
 * @param {Object} MouseEventObject
 */
toggleResizeHandle = function(e){
    if (e !== undefined)
    {
        e.preventDefault();
        
        var pageX = Math.abs( e.pageX - centerLineX);

        if (pageX < 20)
        {
            if ($resizeHandle.css('display') === 'none')
            {
                $resizeHandle.css('display', 'block');
                blockBroadcastView(true);
            }
        }
        else
        {
            if ($resizeHandle.css('display') === 'block' && !isMouseDown)
            {
                $resizeHandle.css('display', 'none');
                blockBroadcastView(false);
            }
        }
    }
    else if ($resizeHandle.css('display') !== 'none')
    {
        $resizeHandle.css('display','none');
        blockBroadcastView(false);
    }
},

/**
 * マニュアルリサイズイベントを削除
 */
clearResizeHandleEvent = function(){
    // $broadcast.show();
    $livecodingContainer.removeClass('non-select');
    $('body')
        .off('mousemove', handleMoveBorder)
        .off('mouseup');
    $mainContainer.on('mousemove', toggleResizeHandle);
    isMouseDown = false;
},

/**
 * iframe内コンテンツへのマウスイベントをブロックする
 * @param {Boolean}
 */
blockBroadcastView = function(isBlock)
{
    var $blockView = $('#blockView', $broadcastInnerContainer);

    if (isBlock)
    {
        if ($blockView.size() === 0)
        {
            $blockView = $('<div id="blockView" class="flow-box"></div>')
                .appendTo($broadcastInnerContainer)
                .css({'opacity':'0.3', 'height':$broadcastContainer.height() });
        }
        else
        {
            $blockView.css({'opacity':'0.3', 'height':$broadcastContainer.height() });
        }
    }
    else if ($blockView.size() > 0)
    {
        $blockView.remove();
    }
};