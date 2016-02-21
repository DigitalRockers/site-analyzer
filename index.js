var util = require('util');
var eyes = require('eyes');
var request = require('request');
var crypto = require('crypto');
var fs = require('fs');

var apiVersion = '3.0';
var baseUrl = 'https://api.site-analyzer.com';

var Siteanalyzer = function(options){
	if(!options)
		options = {};

	this.clientId = options.clientId || process.env.SiteanalyzerClientId;
	this.clientSecret = options.clientSecret || process.env.SiteanalyzerClientSecret;

	if(options.debug){
		this.debug = true;
		this.__inspect = eyes.inspector({maxLength: false, stream: null});
	}

	return this;
};

function serialize(mixed_value) {
	//  discuss at: http://phpjs.org/functions/serialize/
	// original by: Arpad Ray (mailto:arpad@php.net)
	// improved by: Dino
	// improved by: Le Torbi (http://www.letorbi.de/)
	// improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net/)
	// bugfixed by: Andrej Pavlovic
	// bugfixed by: Garagoth
	// bugfixed by: Russell Walker (http://www.nbill.co.uk/)
	// bugfixed by: Jamie Beck (http://www.terabit.ca/)
	// bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net/)
	// bugfixed by: Ben (http://benblume.co.uk/)
	//    input by: DtTvB (http://dt.in.th/2008-09-16.string-length-in-bytes.html)
	//    input by: Martin (http://www.erlenwiese.de/)
	//        note: We feel the main purpose of this function should be to ease the transport of data between php & js
	//        note: Aiming for PHP-compatibility, we have to translate objects to arrays
	//   example 1: serialize(['Kevin', 'van', 'Zonneveld']);
	//   returns 1: 'a:3:{i:0;s:5:"Kevin";i:1;s:3:"van";i:2;s:9:"Zonneveld";}'
	//   example 2: serialize({firstName: 'Kevin', midName: 'van', surName: 'Zonneveld'});
	//   returns 2: 'a:3:{s:9:"firstName";s:5:"Kevin";s:7:"midName";s:3:"van";s:7:"surName";s:9:"Zonneveld";}'

	var val, key, okey,
		ktype = '',
		vals = '',
		count = 0,
		_utf8Size = function(str) {
			var size = 0,
				i = 0,
				l = str.length,
				code = '';
			for (i = 0; i < l; i++) {
				code = str.charCodeAt(i);
				if (code < 0x0080) {
					size += 1;
				} else if (code < 0x0800) {
					size += 2;
				} else {
					size += 3;
				}
			}
			return size;
		},
		_getType = function(inp) {
			var match, key, cons, types, type = typeof inp;

			if (type === 'object' && !inp) {
				return 'null';
			}

			if (type === 'object') {
				if (!inp.constructor) {
					return 'object';
				}
				cons = inp.constructor.toString();
				match = cons.match(/(\w+)\(/);
				if (match) {
					cons = match[1].toLowerCase();
				}
				types = ['boolean', 'number', 'string', 'array'];
				for (key in types) {
					if (cons == types[key]) {
						type = types[key];
						break;
					}
				}
			}
			return type;
		},
		type = _getType(mixed_value);

		switch (type) {
			case 'function':
				val = '';
			break;
			case 'boolean':
				val = 'b:' + (mixed_value ? '1' : '0');
			break;
			case 'number':
				val = (Math.round(mixed_value) == mixed_value ? 'i' : 'd') + ':' + mixed_value;
			break;
			case 'string':
				val = 's:' + _utf8Size(mixed_value) + ':"' + mixed_value + '"';
			break;
			case 'array':
			case 'object':
				val = 'a';
				for (key in mixed_value) {
					if (mixed_value.hasOwnProperty(key)) {
						ktype = _getType(mixed_value[key]);
						if (ktype === 'function') {
							continue;
						}

						okey = (key.match(/^[0-9]+$/) ? parseInt(key, 10) : key);
						vals += serialize(okey) + serialize(mixed_value[key]);
						count++;
					}
				}
				val += ':' + count + ':{' + vals + '}';
			break;
			case 'undefined':
				// Fall-through
			default:
				// if the JS object has a property which contains a null value, the string cannot be unserialized by PHP
				val = 'N';
			break;
		}
		if (type !== 'object' && type !== 'array') {
			val += ';';
		}
		return val;
}

Siteanalyzer.prototype._signature = function(action, params){
	var str = apiVersion + action + serialize(params) + this.clientSecret + this.clientId;
	return crypto.createHash('sha256').update(str).digest('hex');
};

function urlencode(str) {
  //       discuss at: http://phpjs.org/functions/urlencode/
  //      original by: Philip Peterson
  //      improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //      improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //      improved by: Brett Zamir (http://brett-zamir.me)
  //      improved by: Lars Fischer
  //         input by: AJ
  //         input by: travc
  //         input by: Brett Zamir (http://brett-zamir.me)
  //         input by: Ratheous
  //      bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //      bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //      bugfixed by: Joris
  // reimplemented by: Brett Zamir (http://brett-zamir.me)
  // reimplemented by: Brett Zamir (http://brett-zamir.me)
  //             note: This reflects PHP 5.3/6.0+ behavior
  //             note: Please be aware that this function expects to encode into UTF-8 encoded strings, as found on
  //             note: pages served as UTF-8
  //        example 1: urlencode('Kevin van Zonneveld!');
  //        returns 1: 'Kevin+van+Zonneveld%21'
  //        example 2: urlencode('http://kevin.vanzonneveld.net/');
  //        returns 2: 'http%3A%2F%2Fkevin.vanzonneveld.net%2F'
  //        example 3: urlencode('http://www.google.nl/search?q=php.js&ie=utf-8&oe=utf-8&aq=t&rls=com.ubuntu:en-US:unofficial&client=firefox-a');
  //        returns 3: 'http%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3Dphp.js%26ie%3Dutf-8%26oe%3Dutf-8%26aq%3Dt%26rls%3Dcom.ubuntu%3Aen-US%3Aunofficial%26client%3Dfirefox-a'

  str = (str + '')
    .toString();

  // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
  // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .
  replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/%20/g, '+');
}

function http_build_query(formdata, numeric_prefix, arg_separator) {
  //  discuss at: http://phpjs.org/functions/http_build_query/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Legaev Andrey
  // improved by: Michael White (http://getsprink.com)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Brett Zamir (http://brett-zamir.me)
  //  revised by: stag019
  //    input by: Dreamer
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  // bugfixed by: MIO_KODUKI (http://mio-koduki.blogspot.com/)
  //        note: If the value is null, key and value are skipped in the http_build_query of PHP while in phpjs they are not.
  //  depends on: urlencode
  //   example 1: http_build_query({foo: 'bar', php: 'hypertext processor', baz: 'boom', cow: 'milk'}, '', '&amp;');
  //   returns 1: 'foo=bar&amp;php=hypertext+processor&amp;baz=boom&amp;cow=milk'
  //   example 2: http_build_query({'php': 'hypertext processor', 0: 'foo', 1: 'bar', 2: 'baz', 3: 'boom', 'cow': 'milk'}, 'myvar_');
  //   returns 2: 'myvar_0=foo&myvar_1=bar&myvar_2=baz&myvar_3=boom&php=hypertext+processor&cow=milk'

  var value, key, tmp = [],
    that = this;

  var _http_build_query_helper = function(key, val, arg_separator) {
    var k, tmp = [];
    if (val === true) {
      val = '1';
    } else if (val === false) {
      val = '0';
    }
    if (val != null) {
      if (typeof val === 'object') {
        for (k in val) {
          if (val[k] != null) {
            tmp.push(_http_build_query_helper(key + '[' + k + ']', val[k], arg_separator));
          }
        }
        return tmp.join(arg_separator);
      } else if (typeof val !== 'function') {
        return urlencode(key) + '=' + urlencode(val);
      } else {
        throw new Error('There was an error processing for http_build_query().');
      }
    } else {
      return '';
    }
  };

  if (!arg_separator) {
    arg_separator = '&';
  }
  for (key in formdata) {
    value = formdata[key];
    if (numeric_prefix && !isNaN(key)) {
      key = String(numeric_prefix) + key;
    }
    var query = _http_build_query_helper(key, value, arg_separator);
    if (query !== '') {
      tmp.push(query);
    }
  }

  return tmp.join(arg_separator);
}

Siteanalyzer.prototype._request = function(action, params, callback){
	var self = this;

	var url = baseUrl + '/' + apiVersion + '/do/' + action;
	var headers = {
		'x-api-public': this.clientId,
    	'x-api-signature': this._signature(action, params),
    	'Referer': 'dev-dra.cloudapp.net:3333',
    	'Content-Type': 'application/x-www-form-urlencoded'
	};

	var t = Date.now();
	request.post({
			url: url,
			headers: headers,
			body: http_build_query({params: params}) + '&' + 'action=' + action,
			rejectUnauthorized: false,
		}, function(error, response, body){
			self.__debug('POST - ' + url + ' - ' + (Date.now() - t) + ' ms');
			if(error) return callback(error);

			var json;
			try {
				json = JSON.parse(body);
			} catch(e) {
				return callback(body);
			}

			self.__debugInspect(json);

			callback(null, json);
		});
};

/**
 * Call Domain Info API
 *
 * @param domain 	String 		domain
 * @param options 	Object 		option object
 * @param callback 	function 	callback function called with two parameters err, result
 */

Siteanalyzer.prototype.domainInfo = function(domain, options, callback){
	if(!callback){
		callback = options;
		options = {};
	}

	this._request('domaininfo', {url: domain}, callback);
};

/**
 * Call Site Analyzer API
 *
 * @param url 		String 		url
 * @param options 	Object 		option object
 * @param callback 	function 	callback function called with two parameters err, result
 */

Siteanalyzer.prototype.pageAnalizer = function(url, options, callback){
	if(!callback){
		callback = options;
		options = {};
	}

	var criteria = [
		'pageTitle',
		'metaDescription',
		'metaTags',
		'metaRobots',
		'robotsTxt',
		'sitemap',
		'wwwRedirection',
		'linkCanonical',
		'openGraph',
		'twitterCard',
		'googleplusPublisher',
		'linkNb',
		'linkUnderscore',
		'linkDuplicate',
		'linkJuice',
		'linkReliable',
		'linkFollow',
		'cleanUrl',
		'domainLength',
		'pageWeight',
		'downloadTime',
		'compression',
		'scriptInPage',
		'scriptLocation',
		'cssInline',
		'styleTag',
		'cache',
		'doctype',
		'metaCharset',
		'tableDesign',
		'dns',
		'serverConfig',
		'ipv6',
		'textCodeRatio',
		'pageTitleKeywords',
		'hTitle',
		'keywords',
		'htmlStyle',
		'emails',
		'frames',
		'flash',
		'imageAlt',
		'cssPrint',
		'metaViewport',
		'contentLanguage'
	];

	this._request('pageanalyzer', {url: url, criteria: criteria}, function(err, res){
		if(err) return callback(err);
		callback(null, res ? res[0] : {});
	});
};

/**
 * Call W3C Validation API
 *
 * @param domain 	String 		domain
 * @param options 	Object 		option object
 * @param callback 	function 	callback function called with two parameters err, result
 */

Siteanalyzer.prototype.w3cValidation = function(domain, options, callback){
	if(!callback){
		callback = options;
		options = {};
	}

	this._request('w3c', {url: domain}, callback);
};

/**
 * Call IP Geolocalization API
 *
 * @param ip 		String 		ip
 * @param options 	Object 		option object
 * @param callback 	function 	callback function called with two parameters err, result
 */

Siteanalyzer.prototype.ipGeolocalization = function(ip, options, callback){
	if(!callback){
		callback = options;
		options = {};
	}

	this._request('ipgeo', {ip: ip}, callback);
};

/**
 * Call URL Screenshot API
 *
 * @param url 		String 		url
 * @param options 	Object 		option object
 * @param callback 	function 	callback function called with two parameters err, result
 */

Siteanalyzer.prototype.urlScreenshot = function(url, options, callback){
	if(!options.filePath) return callback(new Error('Missing \'options.filePath\' arguments.'));

	var self = this;
	var params = {url: url, format: options.format || '768px*1024px'};
	var action = 'screenshot';
	var path = baseUrl + '/' + apiVersion + '/do/' + action;
	var headers = {
		'x-api-public': this.clientId,
    	'x-api-signature': this._signature(action, params),
    	'Referer': 'dev-dra.cloudapp.net:3333',
    	'Content-Type': 'application/x-www-form-urlencoded'
    	//'Content-Type': 'image/jpeg'
	};
	var error = false;
	var ws = fs.createWriteStream(options.filePath)

	var t = Date.now();
	request.post({
			url: path,
			headers: headers,
			body: http_build_query({params: params}) + '&' + 'action=' + action,
			/*form: {
				params: http_build_query({params: params}) + '&' + 'action=' + action,
				action: action
			},*/
			rejectUnauthorized: false,
		})
	.on('error', function(err) {
		error = true;
		callback(err);
	})
	.on('response', function(response) {
		if(!error){
			if(response.statusCode !== 200){
				error = true;
				return callback(new Error('SiteAnlyzer urlScreenshot - ' + response.statusCode + ' Forbidden'));
			}
			self.__debug('GET - ' + path + ' - ' + (Date.now() - t) + ' ms');
		}
	})
	.pipe(ws);

	ws.on('finish', function(){
		if(!error) callback(null, options.filePath);
	})
};


/**
 * Call Quota API
 *
 * @param options 	Object 		option object
 * @param callback 	function 	callback function called with two parameters err, result
 */

Siteanalyzer.prototype.quota = function(options, callback){
	if(!callback){
		callback = options;
		options = {};
	}

	this._request('quota', {}, callback);
};

/**  Debug  **/
Siteanalyzer.prototype.__debug = function (str) {
	if(this.debug)
		console.log('Site Analyzer - ' + new Date().toISOString() + ' - ' + str);
};

Siteanalyzer.prototype.__debugInspect = function (str, obj) {
	if(this.debug){
		if(obj)
			console.log('Site Analyzer - ' + new Date().toISOString() + ' - ' + str + ' - ' + this.__inspect(obj));
		else
			console.log('Site Analyzer - ' + new Date().toISOString() + ' - ' + this.__inspect(str));
	}
};



module.exports = Siteanalyzer;
