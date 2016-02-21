'use strict';

var should = require('should');

var Siteanalyzer = require('./index');

var sa = new Siteanalyzer();

describe('Site Analyzer unit tests', function() {
	this.timeout(5000);

	it('domainInfo', function(done) {
		sa.domainInfo('www.wikipedia.org', function(err, res) {
			should.not.exist(err);
			res.should.have.property('data');
			res.data.should.be.instanceof(Object);
			done();
		});
	});

	it('pageAnalizer', function(done) {
		sa.pageAnalizer('http://yahoo.com', function(err, res) {
			should.not.exist(err);
			res.should.be.instanceof(Object);
			done();
		});
	});

	it('w3cValidation', function(done) {
		sa.w3cValidation('www.wikipedia.org', function(err, res) {
			should.not.exist(err);
			res.should.have.property('warnings');
			res.should.have.property('errors');
			res.warnings.should.be.instanceof(Array);
			res.errors.should.be.instanceof(Array);
			done();
		});
	});

	/*it('ipGeolocalization', function(done) {
		sa.ipGeolocalization('173.194.112.104', function(err, res) {
			should.not.exist(err);
			res.should.have.property('data');
			res.data.should.be.instanceof(Object);
			done();
		});
	});*/

	it('urlScreenshot', function(done) {
		this.timeout(10000, done);
		sa.urlScreenshot('www.wikipedia.org', {filePath: './testScreeshot.jpg'}, function(err, res) {
			should.not.exist(err);
			res.should.be.instanceof(String);
			done();
		});
	});

	it('quota', function(done) {
		sa.quota(function(err, res) {
			should.not.exist(err);
			res.should.have.property('credits');
			res.credits.should.be.instanceof(String);
			done();
		});
	});
});
