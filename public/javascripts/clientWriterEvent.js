var handleNewFile = function(e) {
    if (e.keyCode === 13)
    {
        // 半全角のスペースを削除
        var filename = $newFileInput.val();
        if ( tab.checkFilename(filename) )
        {
            tab.update(filename, '');
            $newFileInput.val('');
            handleSocketNewFile(filename);
        }   
    }
},

handleClickSynchronize = function(e){
    var filename   = tab.getCurrentFilename(),
        source     = tab.getCurrentSource(filename),
        highlight  = getSelectRowNumbers(filename),
        lineNumber = (highlight.length === 0)
            ? getCursorRowNumbers(filename)
            : highlight[0];
    handleSocketUpdateFile(filename, source, highlight, lineNumber);
},

handleClickUpdateSaveFile = function(e){
    handleUpdateSaveFile();
},

handleClickNewSaveFile = function(e){
    handleNewSaveFile();    
},

handleClickLoadFile = function(e){
    if( confirm('現在の状態が上書きされます。\nよろしいですか？') )
    {
        handleLoadFile();
    }
},

handleReloadIframe = function(e) {
    if (e.keyCode === 13)
    {
        // 半全角のスペースを削除
        var url = $reloadInput.val().split(' ').join('').split('　').join('');
        var s = url.split('/');
        var id = s[ s.length - 1 ];
        if (id.indexOf('lv') === -1 && id.indexOf('co') === -1)
        {
            alert('URLが不正です');
            return;
        }
        
        handleSocketReloadURL(url);
    }
},

handleResize = function() {
    $codingContainer.css({
        'height': window.innerHeight - headerHeight - 40,
    });
    tab.refreshTab(false);
},

/**
 * 選択中の行連番を取得
 * @param {String} filename
 * @return {Array} numbering
 */
getSelectRowNumbers = function(filename) {
    // 対象のDOMを選択
    var selectDOM = $('.page[name="' + filename + '"] > .editable-container').get(0);
    selectDOM.focus();
    var start = selectDOM.selectionStart,
        end = selectDOM.selectionEnd,
        numbering = [],
        startRow = selectDOM.value.slice(0, start).split('\n').length,
        endRow = selectDOM.value.slice(0, end).split('\n').length;

    if (startRow === endRow)
        return numbering;
    
    // 連番化
    for (var i = startRow; i <= endRow; i++)
        numbering.push(i);
    
    console.log('ハイライト:', numbering);
    return numbering;
},

/**
 * かなり大雑把 (´・ω・｀)
 */
getCursorRowNumbers = function(filename) {
    var selectDOM = $('.page[name="' + filename + '"] > .editable-container').get(0);
    selectDOM.focus();
    return parseInt(selectDOM.scrollTop / 30);
},

/**
 * ソースコードを入力しているときの挙動
 */
handleInputSource = function(e){
    switch (e.keyCode)
    {
        case 13: //enter
        case 32: //space
        case 27: //escape
        case 17: //control
        case 16: //shift
        case 18: //option
        case 37: case 38: case 39: case 40://arrow
            return;
        case 56: //(
            if (e.shiftKey)
            {
                e.preventDefault();
                $(this).insertAtCaret('()');
                betweenSelectionPos($(this).get(0));
            }
            break;
        case 188: //<
            if (e.shiftKey)
            {
                e.preventDefault();
                $(this).insertAtCaret('<>');
                betweenSelectionPos($(this).get(0));
            }
            break;
        case 219: //{
            if (e.shiftKey)
            {
                e.preventDefault();
                $(this).insertAtCaret('{}');
                betweenSelectionPos($(this).get(0));
            }
            break;
        case 222: //' or "
            if (e.shiftKey)
            {
                e.preventDefault();
                if (e.altKey)
                    $(this).insertAtCaret('""');
                else
                    $(this).insertAtCaret("''");
                
                betweenSelectionPos($(this).get(0));
            }
            break;
        case 9://tab
            e.preventDefault();
            $(this).insertAtCaret('    ');
            break;
    }
    
    handleClickSynchronize(e);
},

/**
 * カーソルを間に移動させる
 * @param {HTMLElement} elm
 */
betweenSelectionPos = function(elm){
    var selectPos = elm.selectionStart - 1;
       
    if (elm.createTextRange)
    {
        var range = elm.createTextRange();
        range.move('character', selectPos);
        range.select();
    }
    else if (elm.setSelectionRange)
    {
        elm.setSelectionRange(selectPos, selectPos);
    }
};

/**
 * jQuery拡張
 * タブキー入力をインデントコードに変換する
 */
$.fn.extend({
    insertAtCaret: function(v) {
        var o = this.get(0);
        o.focus();
        if (jQuery.browser.msie) {
            var r = document.selection.createRange();
            r.text = v;
            r.select();
        }
        else
        {
            var s = o.value;
            var p = o.selectionStart;
            var np = p + v.length;
            o.value = s.substr(0, p) + v + s.substr(p);
            o.setSelectionRange(np, np);
        }
    }
});