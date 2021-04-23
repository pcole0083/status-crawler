var fs = require('fs');
var Crawler = require('js-crawler');
var HtmlParser = require('node-html-parser');
var parse = HtmlParser.parse;

function crawly(site_url){
	var crawler = new Crawler().configure({
		ignoreRelative: false,
		depth: process.argv[3] || 2,
		shouldCrawl: function(url){
			return url.indexOf(removeProtocol(site_url)) > -1;
		},
		maxRequestsPerSecond: 10
	});

	var pageData = [];

	crawler.crawl({
		url: site_url,
		success: function(page){
			console.log(page.url);
			//console.log(page.response.request);
			if(/category-description/.test(page.content)){
				var pageName = page.response.request.path.replace(/\//g, '-');
				var firstChar = pageName[0];
				if(firstChar === "-"){
					pageName = pageName.substring(1);
				}
				pageName = pageName.replace(pageName[0], pageName[0].toUpperCase());

				var root = parse(page.content);
				var catDesc = root.querySelector('.category-description');
				if(catDesc){
					var catText = catDesc.textContent.trim();
					var catImg = root.querySelector('.category-description img');
					var imgURL = !!catImg ? catImg.getAttribute('src') : '';

					pageData.push([
						pageName,
						"\r" + catText,
						"\r" + imgURL,
						"\r" + "------------------------------------------------------------------------------------------------",
						"\r"
					].join("\n"));
				}
			}
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

				var bodyNameString = removeProtocol(site_url).replace(dirPath, '');
				bodyNameString = "/"+bodyNameString.replace(/\//g, '-') + ".txt";

				if(pageData.length > 0){
					fs.writeFile(dirPath+bodyNameString, pageData.join("\n"), function(err){
						if(err){
							return console.error(err);
						}
						console.log(bodyNameString+' saved successfully');
					});
				}

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
	var crawledConstDir = 'body/';
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