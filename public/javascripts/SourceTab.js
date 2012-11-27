/**
 * SourceTab モジュールは
 * タブとページのDOMを管理し、関連するメソッドを提供します
 */

(function(exports) {
    //================================================================
    // VARIABLE
    //================================================================
    var EXTENTION_LIST = ['xml', 'xhtml', 'xslt', 'html', 'ejs', 'css', 'js', 'jscript', 'javascript'];
    // config
    var _enableCloseButton = false,
        _enableEdit = false,
        _enableRename = false,
        _closeHanlder = function(){},
        _renameHandler = function(){};
        
    // map
    var _tabDOMMap = {}, // filenameをキーにタブのDOM要素を管理
        _pageDOMMap = {}, // filenameをキーにページのDOM要素を管理
        _sourceMap = {}; // filenameをキーにsourceを管理
    // other
    var _currentFileName = '',
        _beforeEditFilename = '', // 編集前の元ファイル名を格納    
        _optionCode = '',
        _currentLinenumber = 0;
    // jquery
    var _$selector,
        _$tabContainer,
        _$tabInnerContainer,
        _$pageContainer;

    //================================================================
    // CONSTRUCTOR
    //================================================================
    var SourceTab = function(selector){
        initialize(selector);
    };
    
    //================================================================
    // PUBLIC PROPERTIES
    //================================================================
    SourceTab.CONFIG_ENABLE_CLOSE_BUTTON = 'enableCloseButton';
    SourceTab.CONFIG_ENABLE_EDITABLE = 'enableEditable'
    SourceTab.CONFIG_ENABLE_RENAME = 'enableRename'
    
    //================================================================
    // PUBLIC METHODS
    //================================================================
    var p = SourceTab.prototype;

    /**
     * SourceTab モジュールの設定
     * @param {Object} data
     */
    SourceTab.config = function(data) {
        for (var key in data)
        {
            switch (key)
            {
                case SourceTab.CONFIG_ENABLE_CLOSE_BUTTON:
                    _enableCloseButton = data[key];
                    break;
                case SourceTab.CONFIG_ENABLE_EDITABLE:
                    _enableEdit = data[key];
                case SourceTab.CONFIG_ENABLE_RENAME:
                    _enableRename = data[key];
            }
        }
    };
    
    /**
     * 追加
     * @param {String} filename
     */
    p.add = function(filename) {
        var style = 'style="width:' + (parseInt( _$selector.width() ) - 10) + 'px;height:' + (parseInt( _$selector.height() ) - 10) + 'px;"';
        _$tabInnerContainer.append('<li class="tab" name="'+ filename +'"><p class="filename">'+ filename +'</p>' + _optionCode + '</li>');
        _$pageContainer.append('<div class="page" name="'+ filename +'" '+ style +'></div>');
        
        _tabDOMMap[filename] = $('li.tab[name = "'+ filename +'"]', _$tabInnerContainer);
        _pageDOMMap[filename] = $('div.page[name = "'+ filename +'"]', _$pageContainer);
        
        addActive(filename);
        
        this.refreshTab(true);
    };
    
    /**
     * 削除
     * @param {String} filename
     */
    p.remove = function(filename) {
        _tabDOMMap[filename].remove();
        _pageDOMMap[filename].remove();
        
        delete _tabDOMMap[filename];
        delete _pageDOMMap[filename];
        delete _sourceMap[filename];
        
        // アクティブタブを削除してた場合、右端のタブをアクティブにする
        if (_currentFileName === filename)
        {
            _currentFileName = '';
            var last = $('li:last-child', _$tabInnerContainer).attr('name');
            if (last !== undefined && last !== '')
            {
                addActive(last);
            }
        }
        
        _closeHanlder(filename);
        
        this.refreshTab(true);     
    };
    
    p.removeAll = function() {
        for (var filename in _pageDOMMap)
            this.remove(filename);
    };
    
    /**
     * 更新
     * @param {String} filename
     * @param {String} source
     * @param {Array} highlights
     */
    p.update = function(filename, source, highlights) {
        // タブが未作成の場合は先に追加
        if ( _tabDOMMap[filename] === undefined )
        {
            this.add(filename);
        }
        _sourceMap[filename] = source;
        
        applyTheme(filename, source, highlights);
        this.refreshPage();
    };
    
    /**
     * 同期
     * @param {String} filename
     * @param {int} lineNumber
     */
    p.synchronize = function(filename, lineNumber) {
        if (_currentFileName != filename)
        {
            addActive(filename);
            scrollPage(lineNumber);
            return;
        }
        
        if (_currentLinenumber != lineNumber)
            scrollPage(lineNumber);
    };
    
    /**
     * タブを再描画する
     * @param {Boolean} isAnimation
     */
    p.refreshTab = function(isAnimation)
    {
        var $tabs = $('li.tab', _$tabInnerContainer),
            len = $tabs.length,
            selectorWidth = parseInt( _$selector.width() ),
            containerWidth = selectorWidth + 10*(len - 1),
            tabWidth = parseInt( containerWidth / len - 34 );
            isAnimation = (isAnimation !== undefined && isAnimation !== 'undefined' ) ? isAnimation : true,
            $filename = $tabs.find('.filename');
                
        if (isAnimation)
        {
            $tabs.stop(true).animate({"width": tabWidth + 'px'}, 200);
            $filename.stop(true).animate({"width": tabWidth - 7 + 'px'}, 200);
        }
        else
        {
            $tabs.css("width", tabWidth + 'px');
            $filename.css("width", tabWidth - 7 + 'px');
        }
        
        this.refreshPage();

        // _minWidth = len * 34;        
    };
    
    /**
     * ページサイズを再描画
     */
    p.refreshPage = function() {
        if (_currentFileName != '')
        {
            var selectorWidth = parseInt( _$selector.width() ),
                selectorHeight = parseInt( _$selector.height() );
                
            if (_enableEdit)
            {
                var pageWidth = selectorWidth - 40 + 'px',
                    pageHeight = selectorHeight - 50 + 'px';
                $('.editable-container', _pageDOMMap[_currentFileName]).css({
                   'maxWidth': pageWidth,
                   'minWidth': pageWidth,
                   'maxHeight': pageHeight,
                   'minHeight': pageHeight
                });
            }

            _pageDOMMap[_currentFileName].css({
                'height': selectorHeight - 10,
                'width': selectorWidth - 10
            });
        }
    };
    
    /**
     * ソースのrawデータの取得
     * @return {Object} sourceMap
     */
    p.getAllSources = function() {
        var sourceMap = {};
        var source;
        for (var key in _sourceMap)
        {
            source = this.getCurrentSource(key);

            if (_enableEdit)
                _sourceMap[key] = source;

            if (key !== 'length' &&
                source !== undefined &&
                source !== null)
            {
                sourceMap[key] = source;
            }
        }
        
        return sourceMap;
    };
    
    p.checkFilename = function(filename) {
        filename = filename.split(' ').join('').split('　').join('');
        
        if (filename === '')
        {
            return false;
        }
        
        var extension = filename.split('.'),
            filenames = getFilenames(),
            isExist = false,
            i, len;
            
        if (extension.length === 1)
        {
            alert('ファイル名に拡張子を追加してください');
            return false;
        }
        
        for (i = 0, len = EXTENTION_LIST.length; i < len; i++)
        {
            if ( extension[1] === EXTENTION_LIST[i] )
            {
                isExist = true;
            }
        }
        
        if (!isExist)
        {
            alert('拡張子が不正です');
            return false;
        }
        
        for (i = 0, len = filenames.length; i < len; i++)
        {
            if ( filename === filenames[i] )
            {
                alert('このファイル名は既に存在しています');
                return false;
            }
        }
        
        return true
    };
    
    p.getCurrentFilename = function() {
        return _currentFileName;
    };
    
    p.getCurrentSource = function(filename) {
        var source = (_enableEdit)
            ? $('.editable-container', _pageDOMMap[filename]).val()
            : _sourceMap[filename];
        
        return source;
    };
    
    p.setCloseHandle = function(handle) {
        _closeHanlder = handle;
    };
    
    p.setRenameHandle = function(handle) {
        _renameHandler = handle;
    };
    
    p.rename = function(oldname, newname) {
        replaceFilename(oldname, newname);
    };
    
    //================================================================
    // PRIVATE METHODS
    //================================================================
    
    /**
     * 初期化
     * @param {String} selector
     */
    var initialize = function(selector) {
        
        if ( !checkError(selector) ) return;
        
        _$selector = $(selector)
            .css({'position':'relative', 'backgroundColor': '#eee'})
            .append('<div id="tab-container" class="flow-box"><ul></ul></div><div id="page-container" class="flow-box"></div>');
        _$tabContainer      = $('#tab-container', _$selector);
        _$tabInnerContainer = $('ul', _$tabContainer)
        _$pageContainer     = $('#page-container', _$selector);
        
        initEvent();
    },
    
    /**
     * エラーの確認
     */
    checkError = function(selector) {
        var bool = true;        

        if (typeof selector !== 'string')
        {
            error('selectorには文字例を指定してください');
            bool = false;
        }
        else if (typeof $ === 'undefined') {
            error('jQueryが正常に読み込まれていません');
            bool = false;
        }
        else if (!_enableEdit && typeof SyntaxHighlighter === 'undefined') {
            error('SyntaxHighlighterが正常に読み込まれていません');
            bool = false;
        }
        else if ($(selector).length === 0)
        {
            error('selectorが存在しません');
            bool = false;
        }
        
        return bool;
    },
    
    /**
     * イベントの初期化
     */
    initEvent = function() {
        // タブの切り替え
        $(document).on('click','#tab-container li', function(e) {
            if ( $(this).attr('class') === 'active' ) return;
            addActive( $('> p', $(this)).text() );
            p.refreshTab();
        });
        
        // クローズボタンの表示
        if (_enableCloseButton)
        {
            _optionCode += '<div class="close-button"><p>×</p></div>';
            $(document).on('click', '#tab-container li > .close-button', function(e) {
                e.stopImmediatePropagation();
                e.stopPropagation();
                var filename = $(this).prev().text();
                p.remove(filename);
            });
        }
        
        if (_enableRename)
        {
            $(document).on('dblclick', '#tab-container .filename', function(e) {
                _beforeEditFilename = $(this)
                    .attr('contenteditable','true')
                    .addClass('enable-rename')
                    .on('keydown', handleKeyDownRename)
                    .text();
            });
            
            var handleKeyDownRename = function(e) {
                console.log(e.keyCode);
                if (e.keyCode === 13)
                {
                    var afterEditFilename = $(this)
                        .off('keydown', handleKeyDownRename)
                        .removeClass('enable-rename')
                        .attr('contenteditable','false')
                        .text();
                    
                    // 編集前と代わりなければ処理終了
                    if (_beforeEditFilename === afterEditFilename)
                    {
                        return;
                    }
                    
                    // 文法的に問題なければ更新
                    if ( !p.checkFilename(afterEditFilename) )
                    {
                        $(this).text(_beforeEditFilename);
                        return;
                    }
                    
                    // ファイル名の更新処理
                    replaceFilename(_beforeEditFilename, afterEditFilename);
                }
                
            };
        }
    },
    
    replaceFilename = function(beforeEditFilename, afterEditFilename) {
        
        // 現在のタブの更新
        if (_currentFileName === beforeEditFilename)
            _currentFileName = afterEditFilename;
        
        // マップ更新
        _tabDOMMap[afterEditFilename] = _tabDOMMap[beforeEditFilename];
        _pageDOMMap[afterEditFilename] = _pageDOMMap[beforeEditFilename];
        _sourceMap[afterEditFilename] = _sourceMap[beforeEditFilename];
        delete _tabDOMMap[beforeEditFilename];
        delete _pageDOMMap[beforeEditFilename];
        delete _sourceMap[beforeEditFilename];
        
        _tabDOMMap[afterEditFilename]
            .attr('name', afterEditFilename)
            .find('.filename')
            .text(afterEditFilename);
        _pageDOMMap[afterEditFilename].attr('name', afterEditFilename);
        
        _renameHandler(beforeEditFilename, afterEditFilename);
    },

    /**
     * active状態を付与
     * @param {String} filename
     */
    addActive = function(filename) {
        if ( filename === undefined || filename === '' || filename === _currentFileName )
        {
            return;
        }
        
        if ( _currentFileName !== '' && _tabDOMMap[_currentFileName].hasClass('active') )
        {
            _tabDOMMap[_currentFileName].removeClass('active');
            _pageDOMMap[_currentFileName].removeClass('active');
        }
        
        _tabDOMMap[filename].addClass('active');
        _pageDOMMap[filename].addClass('active');
        
        _currentFileName = filename;
    },
    
    /**
     * シンタックスカラーを適応
     * @param {String} filename
     * @param {String} source
     * @param {Array} highlights
     */
    applyTheme = function(filename, source, highlights)
    {
        if (typeof filename === 'string' && typeof source === 'string')
        {
            if (!_enableEdit)
            {
                source = source.replace(/</g, '&lt;').replace(/>/g, '&gt;');//.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
                var extension = getExtension(filename);
                extension = (highlights !== undefined && highlights.length > 0)
                    ? extension + '; ruler: true; highlight: [' + highlights.join(', ') + '];'
                    : extension;
                var tag = '<pre class=\"brush: ' + extension + '\">' + source + '</pre>';
                SyntaxHighlighter.highlight( _pageDOMMap[filename].html( tag ).get(0) );
            }
            else
            {
                var pageWidth = _$pageContainer.width() - 40 + 'px',
                    pageHeight = _$pageContainer.height() - 50 + 'px',
                    style = 'max-width:' + pageWidth + '; max-height:' + pageHeight + '; min-width:' + pageWidth + '; min-height:' + pageHeight + ';';
                _pageDOMMap[filename].html( '<textarea class="editable-container" style="' + style + '">' + source + '</textarea>' );
            }
        }
    },
    
    /**
     * 拡張子を取得
     * @param {String} filename: ファイル名
     * @return {String} extention: 拡張子
     */
    getExtension = function(filename)
    {
        var ary = filename.split('.'),
            len = ary.length - 1;
        
        var extension = (len > 0)
            ? ary[len]
            : false;
        
        return extension;
    },
    
    /**
     * スクロール
     * @param {int} lineNumber
     */
    scrollPage = function(lineNumber)
    {
        var $current = _pageDOMMap[_currentFileName],
            posY = (lineNumber > 1) ? $('.line:eq(' + (lineNumber - 1) + ')', $current).offset().top : 0;
            _currentLinenumber = lineNumber;
        
        $current.animate({
            'scrollTop' : posY - _$selector.offset().top
        }, 200);
    },
    
    getFilenames = function() {
        var filenames = [];
        
        for (var key in _tabDOMMap)
        {
            filenames.push(key);
        }
        
        return filenames;
    },
    
    /**
     * エラー表示
     * @param {String} msg
     */
    error = function(msg) {
        console.log(msg);
        alert(msg);
    };
    
    exports.SourceTab = SourceTab;
})(window);