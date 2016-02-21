#Ritetag
[![Build Status via Travis CI](https://travis-ci.org/DigitalRockers/site-analyzer.svg?branch=master)](https://travis-ci.org/DigitalRockers/site-analyzer)
[![NPM version](http://img.shields.io/npm/v/ritetag.svg)](https://www.npmjs.org/package/site-analyzer)

[Site Analyzer](www.site-analyzer.com) api module for [nodejs](nodejs.org)

Site Analyzer API documentation: [
https://api.site-analyzer.com/documentation/](
https://api.site-analyzer.com/documentation/)

This software is released under the MIT license. See `LICENSE` for more details

## Download and Installation

From the command line

	$ npm install site-analyzer

package.json

	dependencies: {
      ...
      "site-analyzer": "*$version*",
      ...
    }
    ...

## Example use

```javascript
var SiteAnalyzer = require('site-analyzer');

var sa = new SiteAnalyzer({
	clientId: 'YOUR_CONSUMER_KEY',
	clientSecret: 'YOUR_CONSUMER_SECRET',
});

sa.pageAnalizer('http://wikipedia.org', function(error, results){
	if(error) return console.error(error);
	console.log(results);
});
```

## Documentation

Initialize Ritetag object:
```javascript
var SiteAnalyzer = require('ritetag');
var sa = new SiteAnalyzer({
	clientId: 'YOUR_CONSUMER_KEY' || process.env.SiteAnalyzerClientId,
	clientSecret: 'YOUR_CONSUMER_SECRET' || process.env.SiteAnalyzerClientSecret,
	debug: false //optional
});
```
### domainInfo(domain, callback)
Domain Info get data about a domain name : availability, owner, registrar, creation data and expiration data.

```javascript
sa.domainInfo('www.wikipedia.org', function(error, results){
	...
});
```

### pageAnalizer(url, callback)
Get data and analyze results from a webpage on several criteria.

```javascript
sa.pageAnalizer('http://wikipedia.org', function(error, results){
	...
});
```

### w3cValidation(domain, callback)

```javascript
sa.w3cValidation('www.wikipedia.org', function(error, results){
	...
});
```

### urlScreenshot(url, options, callback)
Take screenshot.

Available options:
 * `format`: screenshot dimension
 * `filePath`

```javascript
sa.urlScreenshot('www.wikipedia.org', {format: '768px*1024px', filePath: SCREENSHOT_FILE_PATH} function(error, results){
	...
});
```
### quota(callback)
Api quota status

```javascript
sa.quota(function(error, results){
	...
});
```
