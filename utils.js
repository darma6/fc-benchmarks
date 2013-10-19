
//random string generator
exports.str = function(length){
    var ch = '0123456789abcdef';
	var n = ch.length;	
	var s = '';
	for(var i=0;i<length;i++){
	    var k = exports.randInt(0, n-1);
		s+= ch[k];
	}
	return s;
};

//random int generator
exports.randInt = function(min, max){
    return min + Math.round((max-min)*Math.random());
};

exports.timer = function(){
    this.ts = [];
	this.start = function(){
		this.ts.push(process.hrtime());
	};
	this.elapsed = function(tag){
		var t = process.hrtime();
		var previous = this.ts[this.ts.length-1];		
		this.ts.push(t);
   		var ms = 1000*(t[0]-previous[0]) + (t[1]-previous[1])/1000000;		
		console.log(tag + ' : ' + ms + ' ms');
		return ms;
	};
	this.total_elapsed = function(tag){
		var t = process.hrtime(this.ts[0]);
   		var ms = 1000*(t[0]) + (t[1])/1000000;		
		console.log('total elapsed : ' + ms + ' ms (' + tag + ')');
		return ms;
	};	
	this.start();
};


//HTTP request helper
var http = require('http');

exports.APIRequest = function(opts, cb){

	var options = {
		host: opts.host ? opts.host : '',
		port: opts.port ? opts.port : 80,
		path: opts.path ? opts.path : '',
		method: 'GET'
	};

	var req = http.request(options, function(res){
	    var body = '';
		res.setEncoding('utf8');
		res.on('data', function(chunk){
            body+= chunk;
		});
		res.on('end', function(){
            cb(null, res.statusCode, body); 
		});		
	});

	req.on('error', function(err){
	    cb(err);
	});
	
	req.end();
	
};