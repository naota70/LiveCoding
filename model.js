var mongoose = require('mongoose')
  , Secret = require('./secret').Mongo()
  , Schema = mongoose.Schema
  , DB_PATH = 'mongodb://' + Secret.user + ':' + Secret.pass + '@localhost/' + Secret.dbname;
  // , DB_PATH = 'mongodb://localhost/livecoding_source';

mongoose.connect(DB_PATH, function(err){
    console.log( (err) ? err : 'connection success!');
});

var SourceCode = new Schema({
  saveTime:   Date,
  files: Array,
});

// ソースコード
exports.SourceCode = mongoose.model('SourceCode', SourceCode);

// ニコ生URL
exports.BroadCastURL = mongoose.model('BroadCastURL', new Schema({
    url: String,
}));