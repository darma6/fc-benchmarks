
/**
/ conf
**/
var web_host = '127.0.0.1';
var web_port = 1401;

var api_host = '127.0.0.1';
var api_port = 1400;

/**
/ requests to :
/ http://web_host:web_port/simple-get will run a "simple get" request to/from API server
/ http://web_host:web_port/simple-set will run a "simple set" request to/from API server
/ http://web_host:web_port/multi-get will run a "multi get" request to/from API server
**/


var http = require('http');
var url = require('url');
var utils = require('./utils');


//create HTTP API server
http.createServer(function(req, res){

    var timer, ms;
	
	//parse URL
	var parts = url.parse(req.url);				
	
    //reply helper
	res.reply = function(http_status, message){
		ms = timer.total_elapsed('HTTP ' + http_status + ' : ' + parts.pathname); //API call - total elapsed time in ms - value to benchmark										
		this.writeHead(http_status, {'Content-Type': 'text/plain'});
		this.end(message + '\n');		
	}	

    req.on('data', function(data){});

    var paths = {
		'/simple-get':true, 
		'/simple-set':true, 
		'/multi-get':true
	};
	
    req.on('end', function(){
		timer = new utils.timer(); //ref. time				
	    if(paths[parts.pathname]){	
			utils.APIRequest({host:api_host, port:api_port, path:parts.pathname}, function(err, status, response){
			    if(err){
					res.reply(500, err.toString());																					
				}else{
					res.reply(status, response);																	
				}
			});
		}else{
			res.reply(404, 'Not found.');												
		}
    });	
	
}).listen(web_port, web_host);

console.log('App server running at ' + web_host + ':' + web_port);

