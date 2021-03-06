var mongoose = require('mongoose')
var Application = mongoose.model('Application')
var utils = require('../../lib/utils')
var extend = require('util')._extend
var url = require("url");
var Firmware = mongoose.model('Firmware')


exports.images = function (req,res,next) {
	var image;
	var versions = versions=req.application.versions;
	if(versions.length>0){
		var version = versions[versions.length-1];
		for(var i=0;i<version.firmwares.length;i++){
			if(version.firmwares[i].name==req.params.image){
				image = {};
				image.application = req.application.name;
				image.last = {
					version:version.version,
					created:version.createdAt,
					protocol:url.parse(version.firmwares[i].url).protocol,
					host:url.parse(version.firmwares[i].url).host,
					path:url.parse(version.firmwares[i].url).path
				};
				break;
			}
		}	
	}
	
	if(!image)
		return res.status(400).send({errors:["Image not found"]});
	res.status(200).send(image);
}
exports.createFirmwares = function (req,res,next) {
	var firmware = new Firmware(req.body);
	if(req.files && req.files.data && req.files.data.data){
	    firmware.data = req.files.data;
	    firmware.name = req.files.data.name;
	    firmware.mimetype = req.files.data.mimetype;
	    firmware.size = req.files.data.size;

	    // should validate size on before
	    if(firmware.size > 1000000){
	      res.status(400).send({errors:["File limit size 1M"]});
	    }
  	}
  
	firmware.user = req.user;
	firmware.save(function (err) {
		if (!err) {
			var port = req.app.settings.port == 80 || req.app.settings.port == 443?'':':'+req.app.settings.port;
			originUrl = req.protocol + '://' + req.hostname +  port + '/firmwares/' + firmware._id + '/download'
	     	return res.status(201).send({
	     		url:originUrl,
	     		parseUrl:{
					protocol:url.parse(originUrl).protocol,
					host:url.parse(originUrl).host,
					path:url.parse(originUrl).path
	     		},
	     		created:firmware.createdAt
	     });
		}
		res.status(400).send({errors: utils.errors(err.errors || err)});
	});
}
