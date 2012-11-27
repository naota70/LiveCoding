var BroadCastURL = require('../model').BroadCastURL;

// トップ
exports.index = function(req, res){
    BroadCastURL.find({}, null, { sort:{saveTime: -1}, limit:1}, function(err, data){
        console.log('error:', err, data);
        var url = (data[0] === undefined || data[0].url === undefined)
            ? 'http://com.nicovideo.jp/community/co1251273'
            : data[0].url;
        res.render('index', { 'title': 'ライブコーディング｜SRTスタヂオ', 'url':url});
    });
};