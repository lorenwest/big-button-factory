var express = require('express');
var http = require('http');
var path = require('path');
var BBFProbe = require('./lib/BBFProbe');
var Monitor = require('monitor-min');
var config = require('config');
var app = express();


app.use(express.static(path.join(__dirname, 'public')));
var appServer = http.createServer(app).listen(config.BBF.port, function(){

  // Splat
  console.log('' +
  '   ___  _        ___       __  __              ____         __                \n' +
  '  / _ )(_)__ _  / _ )__ __/ /_/ /____  ___    / __/__ _____/ /____  ______ __ \n' +
  ' / _  / / _ `/ / _  / // / __/ __/ _ \\/ _ \\  / _// _ `/ __/ __/ _ \\/ __/ // / \n' +
  '/____/_/\\_, / /____/\\_,_/\\__/\\__/\\___/_//_/ /_/  \\_,_/\\__/\\__/\\___/_/  \\_, /  \n' +
  '       /___/                                                          /___/');
  console.log('Express server listening on port ' + config.BBF.port);

  // Add the monitor-min service to the existing app server
  var monitorService = new Monitor.Server({server:appServer});
  monitorService.start();
});
