var OAuth = require('oauth').OAuth
  , Secret = require('../secret').Twitter()
  , BroadCastURL = require('../model').BroadCastURL
  , HOME_PAGE = 'http://livecoding.srt-s.com/'
  , oa = new OAuth('https://api.twitter.com/oauth/request_token'
                 , 'https://api.twitter.com/oauth/access_token'
                 , Secret.key
                 , Secret.secretKey
                 , '1.0'
                 // , 'http://localhost:8124/authorized'
                 , 'http://livecoding.srt-s.com/authorized'
                 , 'HMAC-SHA1'),

authorize = function (req, res) {
    console.log('authorize', JSON.stringify(req.session));
    
    oa.getOAuthRequestToken( function(error, oauth_token, oauth_token_secret, results){
        console.log('authorize', error);
        if(error)
        {
            res.writeHead(500, {'Content-Type': 'text/html'});
            res.send('error :' + error);
        }
        else
        {          
            req.session.oauth = {
                oauth_token           : oauth_token,
                oauth_token_secret    : oauth_token_secret,
                request_token_results : results
            };
            console.log(JSON.stringify(req.session));
            res.redirect('http://twitter.com/oauth/authorize?oauth_token=' + oauth_token);
        }
    });
},

authorized = function (req, res){
    var oauth_token = req.query.oauth_token;
    var oauth_verifier = req.query.oauth_verifier;

    if ( !req.session.oauth ){
        res.redirect(HOME_PAGE); // invalid callback url access;
    }

    oa.getOAuthAccessToken( oauth_token, null, oauth_verifier,
        function(error, oauth_access_token, oauth_access_token_secret, results) {
        if (error)
        {
            res.send(error);
        }
        else
        {
            req.session.oauth.oauth_access_token = oauth_access_token;
            req.session.oauth.oauth_access_token_secret = oauth_access_token_secret;
            req.session.oauth.access_token_results = results;
            req.session.user = results.screen_name;
            res.redirect('/writer');
        }
    });
};

// 管理画面
exports.index = function(req, res){
    
    if( req.session.oauth && req.session.oauth.oauth_access_token_secret )
    {
        var user = req.session.user;
        console.log('ScreenName', user);
        switch (user)
        {
        case 'srt_s': // SRTスタヂオ
        case 'naota70': // nao太
        case 'yaoce': // たかぴ
            BroadCastURL.find({}, null, { sort:{saveTime: -1}, limit:1}, function(err, data){
                console.log('error:', err, data);
                var url = (data[0] === undefined || data[0].url === undefined)
                    ? 'http://com.nicovideo.jp/community/co1251273'
                    : data[0].url;
                res.render('writer', { 'title': 'ライブコーディング｜SRTスタヂオ', 'url':url});
            });
            break;
        default:
            res.redirect(HOME_PAGE);
            break;
        }
    }
    else
    {
        authorize(req, res);
    }
};

exports.logout = function(req, res){
    req.session.destroy(function() {
        res.redirect(HOME_PAGE);
    });
};

exports.authorized = function(req, res){
    authorized(req, res);
};