var  fs = require('fs');
var Crawler = require('js-crawler');

function crawly(site_url){
	var crawler = new Crawler().configure({
		ignoreRelative: false,
		depth: process.argv[3] || 2,
		shouldCrawl: function(url){
			return url.indexOf(removeProtocol(site_url)) > -1;
		},
		maxRequestsPerSecond: 10
	});

	crawler.crawl({
		url: site_url,
		success: function(page){
			console.log(page.url);
		},
		failure: function(response){
			console.warn('ERROR occurred: ');
			console.warn(response.status);
			console.warn(response.url);
		},
		finished: function(crawledUrls) {
			var failureURLs = crawledUrls.filter(function(element){
				return ~~element[0] !== 200;
			});

			var successURLs = crawledUrls.filter(function(element){
				return ~~element[0] === 200;
			});

			mkdir(site_url, function(dirPath){
				
				var datestring = getDateString();
				var successNameString = "/successes_"+datestring+".txt";
				var failNameString = "/failures_"+datestring+".txt";

				if(successURLs.length > 0){
					fs.writeFile(dirPath+successNameString, successURLs.join("\n"), function(err){
						if(err){
							return console.error(err);
						}
						console.log(successNameString+' saved successfully');
					});
				}

				if(failureURLs.length > 0){
					fs.writeFile(dirPath+failNameString, failureURLs.join("\n"), function(err){
						if(err){
							return console.error(err);
						}
						console.log(failNameString+' saved successfully');
					});
				}

			});
		}
	})
}

function getDateString(){
	var date = new Date();
	var dateArray = [
		date.getMonth(),
		date.getDate(),
		date.getFullYear(),
		Date.now()
	];
	return dateArray.join("-"); 
}

function removeProtocol(url_path){
	var string = url_path.replace(/^(https?|ftp):\/\//, '');
	var lastChar = string.charAt(string.length - 1);

	if(lastChar === '/'){
		string = string.substring(0, string.length - 1);
	}
	return string;
}

function mkdir(dir_path, callback){
	var mkdirp = require('mkdirp');
	var crawledConstDir = 'crawled/';
	if(!dir_path){
		return console.error('Invalid dir_path');
	}

	var dirPath = crawledConstDir + removeProtocol(dir_path);

	mkdirp(dirPath, function(err){
		if(!!err){
			return console.error(err);
		}
		callback(dirPath);
	});
}


var crawl_url = process.argv[2] || "https://www.pixafy.com";
crawly(crawl_url);