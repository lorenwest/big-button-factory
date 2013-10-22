// BBFProbe.js
(function(root) {

  // Module loading - this runs server-side only
  var Monitor = require('monitor-min'),
      Backbone = Monitor.Backbone,
      Probe = Monitor.Probe,
      _ = Monitor._,
      log = Monitor.getLogger('BBFProbe'),
      crypto = require('crypto'),
      exec = require('child_process').exec,
      CONFIG = require('config');

  // Constants
  var NUM_TRAYS = 4;
  var BUTTONS_PER_TRAY = 20;
  var TRAY_TYPES = [

    {name: 'Crown Royal', buttonClass: 'B17'},
    {name: 'Force Field', buttonClass: 'B16'},
    {name: 'Line Dancer', buttonClass: 'B19'},
    {name: 'Grandma\'s Purple', buttonClass: 'B4'},

    {name: 'Dancing Ladies', buttonClass: 'B13'},
    {name: '4-Star Spectacular', buttonClass: 'B14'},
    {name: 'Brushed Aluminum', buttonClass: 'B15'},

    {name: 'Into the Knight', buttonClass: 'B18'},
    {name: 'Gold Digger', buttonClass: 'B9'},
    {name: 'Frog\'s Eye', buttonClass: 'B10'},
    {name: 'Sore Throat', buttonClass: 'B11'},
    {name: 'Time\'s Up', buttonClass: 'B12'},


    {name: 'Depressed & Blue', buttonClass: 'B7'},
    {name: 'Bubblegum on your Shoe', buttonClass: 'B8'},
    {name: 'Stargate', buttonClass: 'B1'},
    {name: 'Spaceship Portal', buttonClass: 'B2'},
    {name: 'Radio Head', buttonClass: 'B6'},
    {name: 'Mech Warrior', buttonClass: 'B5'},
    {name: 'Vampire Bite', buttonClass: 'B3'}
  ];

  /**
  * The BBF probe represents the current state of the button trays
  * and all buttons in them.
  *
  * @class BBFProbe
  * @extends Probe
  * @constructor
  * @param model - Monitor data model elements
  *     @param model.Tray[0-n] {Object} Objects representing each tray
  *     @param model.B[trayNum]_[0-n] {String} Blank if button hasnt been pushed,
  *            or the md5 hash of the gravatar email of the button pusher.
  */
  var BBFProbe = Probe.extend({

    // Exposed probeClass name for monitors
    probeClass: 'BBFProbe',

    initialize: function(){
      var t = this;
      Probe.prototype.initialize.apply(t, arguments);

      // Set the initial button type to use
      t.nextTrayTypeNum = Math.floor(Math.random() * TRAY_TYPES.length);

      // Create the initial trays
      for (var trayNum = 0; trayNum < NUM_TRAYS; trayNum++) {
        t.newTray(trayNum);
      }

      // Expose this probe to global
      global.BBFProbe = t;
    },

    /**
    * Build a new tray
    *
    * This method removes any prior tray data, and populates a new tray with
    * either the next type of tray, or the specified tray type
    */
    newTray: function(trayNum, trayTypeNum) {
      var t = this;

      // Get the tray type
      if (_.isUndefined(trayTypeNum)) {
        trayTypeNum = t.nextTrayTypeNum++;
        if (t.nextTrayTypeNum >= TRAY_TYPES.length) {
          t.nextTrayTypeNum = 0;
        }
      }
      var trayType = TRAY_TYPES[trayTypeNum];

      // Assure a new tray type
      if (t.get('Tray' + trayNum) && t.get('Tray' + trayNum).name == trayType.name) {
        t.newTray(trayNum);
        return;
      }

      // Populate the tray
      t.set('Tray' + trayNum, trayType);

      // Populate the buttons
      for (var i = 0; i < BUTTONS_PER_TRAY; i ++) {
        t.set('B' + trayNum + '_' + i, '');
      }
    },

    /**
    * This control method is called from the browser when a big button is pushed
    *
    * @param options {object} Options
    *     @param options.buttonId {String} ID of the button pushed
    *     @param options.photoUrl {String} The URL of the person that pushed the button
    * @param [callback] {function(err)} Callback
    */
    buttonPushed_control: function(options, callback) {
      var t = this,
          trayId = options.buttonId.substr(1,1);

      // Set the photo into the button
      t.set(options.buttonId, options.photoUrl);

      // Let the picture get updated, then check if
      // this is the last button pushed in the tray
      setTimeout(function(){

        // Get a new tray if all buttons are pushed
        var numPushed = 0;
        for (var i = 0; i < BUTTONS_PER_TRAY; i++) {
          if (t.get('B' + trayId + '_' + i).length > 0) {
            numPushed++;
          }
        }
        if (numPushed == BUTTONS_PER_TRAY) {
          t.newTray(trayId);
        }

        callback();
      }, 100);
    },

    /**
    * This attempts to convert a name into a photo URL for that person
    *
    * The 'github' type is the github name. 'gravatar' type is the gravatar
    * email address, and 'twitter' is their twitter name without the '@'.
    *
    * @param options {object} Options
    *     @param options.type {String} One of "github", "gravatar", or "twitter"
    *     @param options.name {String} The URL of the person that pushed the button
    * @param callback {Function(err, url)} The callback function
    *     @param callback.err {Object} The error object if an error occurred
    *     @param callback.url {String} The photo URL for that person
    */
    findPhotoUrl_control: function(options, callback) {
      var t = this,
          type = options.type,
          name = options.name,
          url = null;

      // Gravatar: Return the MD5 hash of their lowercased, trimmed email
      if (type === 'gravatar') {
        var md5 = crypto.createHash('md5');
        md5.update(name.toLowerCase().trim());
        url = 'http://www.gravatar.com/avatar/' + md5.digest('hex') + '.jpg';
        return callback(null, url);
      }

      // Twitter name
      else if (type === 'twitter') {
        url = 'https://twitter.com/' + name;
        t.getAvatarImgLine(url, 'avatar size73', function(err, avatarUrl) {
          if (err) {
            return callback(err);
          }

          // Parse the http portion
          var part = avatarUrl.substr(avatarUrl.indexOf('http'));
          part = part.substr(0, part.indexOf('"'));
          return callback(err, part);
        });
      }

      // Github name
      else if (type === 'github') {
        url = 'https://github.com/' + name;
        t.getAvatarImgLine(url, '<img class=.avatar. ', function(err, avatarUrl) {
          if (err) {
            return callback(err);
          }

          // Parse the http portion
          var part = avatarUrl.substr(avatarUrl.indexOf('http'));
          part = part.substr(0, part.indexOf('"'));
          return callback(err, part);
        });
      }

      else {
        return callback('Unknown name type: ' + type);
      }

    },

    // Get the entire HTML line that contains the avatar image
    getAvatarImgLine: function(url, grepFor, callback) {
      var cmd = 'curl -Ls "' + url + '" | grep "' + grepFor + '"';
      var child = exec(cmd, function(error, stdout, stderr){
        callback(error, stdout);
      });
    }

  });

}(this));
