
/**
/ conf
**/
var web_host = '127.0.0.1';
var web_port = 1400;

var redis_shards = [];
redis_shards.push({host:'127.0.0.1', port:6379});
redis_shards.push({host:'127.0.0.1', port:6379}); //TODO create different shard
redis_shards.push({host:'127.0.0.1', port:6379}); //TODO create different shard
//TODO create more shards


/**
/ requests to :
/ http://web_host:web_port/simple-get will run a "simple get" request
/ http://web_host:web_port/simple-set will run a "simple set" request
/ http://web_host:web_port/multi-get will run a "multi get" request
**/


var http = require('http');
var url = require('url');
var utils = require('./utils');

/**
/ Redis set-up, create clients
**/
var redis = require('redis');
var clients = [];
for(var i=0;i<redis_shards.length;i++){
    var client = redis.createClient(redis_shards[i].port, redis_shards[i].host);
	(function(host, port){
		client.on('error', function(err){
			console.log('Error on ' + host + ':' + port + ' | ' + err.toString());
		});		
	})(redis_shards[i].host, redis_shards[i].port);
	clients.push(client);
}


//create HTTP API server
http.createServer(function(req, res){

    //ref. time
    var timer = new utils.timer();	
	
	//parse URL
	var parts = url.parse(req.url);				
	
    //reply helper
	res.reply = function(http_status, message){
		this.writeHead(http_status, {'Content-Type': 'text/plain'});
		this.end(message + '\n');		
		var ms = timer.total_elapsed('HTTP ' + http_status + ' : ' + parts.pathname);									
	}	

    req.on('data', function(data){});
	
    req.on('end', function(){
        if(parts.pathname == '/simple-get'){
		    simple_get(function(obj){
				res.reply(200, JSON.stringify(obj));													
			});
        }else if(parts.pathname == '/simple-set'){
		    simple_set(function(obj){
				res.reply(200, JSON.stringify(obj));													
			});
        }else if(parts.pathname == '/multi-get'){
		    multi_get(function(obj){
				res.reply(200, JSON.stringify(obj));													
			});
		}else{
			res.reply(404, 'Not found.');										
		}
    });	
	
}).listen(web_port, web_host);

console.log('API server running at ' + web_host + ':' + web_port);


/**
/ access patterns
**/
var hashkey = 'fc-bench-hash'; 
var incrkey = 'fc-bench-ids'; 
var prefix = 'fc-bench-obj:';
	
function simple_set(cb){

    var timer = new utils.timer();	
	var ms;

	var objkey = utils.str(32); 
	var props = {};
	for(var i=0;i<10;i++){
		props[utils.str(8)] = utils.str(32);
	}

	//select random shard
	var k = utils.randInt(0, clients.length-1); 
    var db = clients[k];

	ms = timer.elapsed('simple_set : random string generation and client selection'); //return elapsed time in ms					
	
	db.hexists(hashkey, objkey, function(err, response){
		db.incr(incrkey, function(err, response){
		    var objid = parseInt(response);
			db.hset(hashkey, objkey, objid, function(err, response){
				db.hmset(prefix + objid, props, function(err, response){
					ms = timer.elapsed('simple_set : elapsed in redis'); //return elapsed time in ms									
					cb('OK');
				});
			});				
		});				
	});
	
}

function simple_get(cb){

    var timer = new utils.timer();	
	var ms;

	//select random shard
	var k = utils.randInt(0, clients.length-1); 
    var db = clients[k];

	ms = timer.elapsed('simple_get : client selection'); //return elapsed time in ms					
	
	db.get(incrkey, function(err, response){
	    var maxid = parseInt(response);
		var objid = utils.randInt(1, maxid); //random id
		ms = timer.elapsed('simple_get : get objid'); //return elapsed time in ms													
		db.hgetall(prefix + objid, function(err, response){
			ms = timer.elapsed('simple_get : elapsed in redis'); //return elapsed time in ms									
			cb(response);
		});				
	});
	
}


function multi_get(cb){

    var timer = new utils.timer();	
	var ms;

    //select an id and get all objects with that id from all shards
    var db1 = clients[0];
	db1.get(incrkey, function(err, response){
	    var maxid = parseInt(response);
		var objid = utils.randInt(1, maxid); //random id
		var results = []; //store results
		var count = 0; //count shard responses
		ms = timer.elapsed('multi_get : get maxid'); //return elapsed time in ms											
		for(var i=0;i<clients.length;i++){
			clients[i].hgetall(prefix + objid, function(err, response){
			    if(response){
					results.push(response);
				}else{
					results.push('no object ' + objid + ' in this shard.');				
                }				
				count++;
				if(count >= clients.length){ //got all clients responses
					ms = timer.elapsed('multi_get : elapsed in redis'); //return elapsed time in ms									
					cb(results);
				}		
			});
		}	
	});
	
}	

