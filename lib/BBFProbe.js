// BBFProbe.js
(function(root) {

  // Module loading - this runs server-side only
  var Monitor = require('monitor-min'),
      Backbone = Monitor.Backbone,
      Probe = Monitor.Probe,
      _ = Monitor._,
      log = Monitor.getLogger('BBFProbe'),
      CONFIG = require('config');

  // Constants
  var NUM_TRAYS = 5;
  var BUTTONS_PER_TRAY = 16;
  var TRAY_TYPES = [
    {name: 'Red Rover', buttonClass: 'red'},
    {name: 'Blue Sky', buttonClass: 'blue'},
    {name: 'Green Hornet', buttonClass: 'green'}
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
      t.nextTrayTypeNum = 0;

      // Create the initial trays
      for (var trayNum = 0; trayNum < NUM_TRAYS; trayNum++) {
        t.newTray(trayNum);
      }
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
    */
    buttonPushed_control: function(options) {
      var t = this;
      t.set(options.buttonId, options.photoUrl);
    }

  });

}(this));
