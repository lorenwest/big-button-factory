$(function(){

  // Constants
  var BUTTONS_PER_TRAY = 20,
      NUM_TRAYS = 4,
      AJAX_LOADER = '/img/ajax-loader.gif',
      HELP_IMG = '/img/question.png';

  // Preload images
  $('<img/>')[0].src = AJAX_LOADER;

  // Create the BBF namespace
  var BBF = {trays:{}};

  // Button Tray Class
  BBF.Tray = function(options) {
    var t = this;
    t.num = options.num;
    t.name = options.name;
    t.buttonClass = options.buttonClass;

    // Build the HTML
    var html = '<div id="Tray' + t.num + '" class="tray clearfix">';
    html += '<div class="tray-name">' + t.name + '</div>';
    for (var i = 0; i < BUTTONS_PER_TRAY; i++) {
      html += '<div id="B' + t.num + '_' + i + '" class="bbf-button ' + t.buttonClass + '" src="">&nbsp;</div>';
    }
    html += '</div>';
    $(html).appendTo('#Tray' + t.num + 'Container');
  };

  // Connect to the backend monitor that represents the current button trays
  window.BBFMonitor = new Monitor({probeClass: 'BBFProbe'});
  BBFMonitor.connect(function(error){

    // Add the trays
    for (var trayNum = 0; trayNum < NUM_TRAYS; trayNum++) {

      // Visualize the tray
      var trayId = 'Tray' + trayNum;
      var monitorTray = BBFMonitor.get(trayId);
      BBF.trays[trayId] = new BBF.Tray({
        num: trayNum,
        name: monitorTray.name,
        buttonClass: monitorTray.buttonClass
      });
    }

  });

  // Handle a button click
  $('#left').delegate('.bbf-button', 'click', function(event) {
    var buttonId = event.currentTarget.id,
        photoUrl = window.photoUrl,
        currentUrl = $('#' + buttonId).attr('src');

    if (!photoUrl) {
      alert('Enter your Profile Photo to push buttons')
      return;
    }

    // Don't allow a click if it's already set
    if ($('#' + buttonId).attr('src').length > 0) {
      return;
    }

    // Tell the backend the button was pushed
    BBFMonitor.control('buttonPushed', {buttonId: buttonId, photoUrl: photoUrl});
  });

  // Notify me when the BBFMonitor changes
  BBFMonitor.on('change', function(){

    // Process all changed attributes
    var changedAttrs = BBFMonitor.changedAttributes();
    for (attrName in changedAttrs) {

      // Has a tray changed?
      if (attrName.indexOf('Tray') === 0 && changedAttrs[attrName].name != BBF.trays[attrName].name) {
        var trayId = attrName,
            trayNum = trayId.substr(4,1),
            selector = '#' + trayId,
            oldTray = $(selector);

        // Animate the old tray out
        oldTray.animate({marginLeft: -2000}, 360, function() {
          oldTray.remove();
          var monitorTray = BBFMonitor.get(trayId);
          BBF.trays[trayId] = new BBF.Tray({
            num: trayNum,
            name: monitorTray.name,
            buttonClass: monitorTray.buttonClass
          });

          // Animate the new tray in
          $(selector).css({marginLeft:-2000}).animate({marginLeft: 0}, 360);
        });
      }

      // Has a button changed?
      if (attrName.indexOf('B') === 0) {
        var buttonId = attrName;
        var pictureUrl = changedAttrs[attrName];
        if (pictureUrl.length > 0) {
          $('#' + buttonId).attr('src', pictureUrl).css('backgroundImage', 'url(' + pictureUrl + ')');
        }
      }
    }
  });

  // Show the help screen
  $('#photo').on('click', function() {
    alert('Add your profile photo to start.\n\nThis can be your github name,\nyour @twitterName,\nyour gravatar email address,\nor any photo URL starting with http://');
  });

  // Show the users photo, save to localStorage, and make global
  var showPhoto = function(userName, photoUrl) {
    $('#name').val(userName);
    $('#photo').attr('src', photoUrl);
    localStorage.photoUrl = photoUrl;
    localStorage.userName = userName;
    window.photoUrl = photoUrl;
  }


  // Process the user name into their photo URL
  $('#begin').click(function(){
    var userName = $('#name').val(),
        trimmedName = userName.trim(),
        nameType = null;

    // Get the user name and
    if (!userName) {
      showPhoto('',HELP_IMG);
      window.photoUrl = null;
      return;
    }

    // Is it an url to a photo?
    if (trimmedName.match(/^http[s]?:\/\//i)) {
      return showPhoto(trimmedName, trimmedName);
    }

    // It's a twitter name if it starts with a @
    if (trimmedName.match(/^@/)) {
      trimmedName = trimmedName.substr(1);
      nameType = 'twitter';
    }

    // It's a gravatar name if it contains an @
    else if (userName.match(/@/)) {
      nameType = 'gravatar';
    }

    // Otherwise it's a github name
    else {
      nameType = 'github';
    }

    // Load the ajax spinner
    $('#photo').attr('src', AJAX_LOADER);

    // Tell the backend the button was pushed
    BBFMonitor.control('findPhotoUrl', {type: nameType, name: trimmedName}, function(err, photoUrl){
      if (err) {
        showPhoto('',HELP_IMG);
        alert('Oops - we couldn\'t find that account.');
        return;
      }
      showPhoto(userName, photoUrl);
    });

  });
  $('#name').focus();

  // Set the photo url if it's found in local storage
  if (localStorage.photoUrl) {
    showPhoto(localStorage.userName, localStorage.photoUrl);
  }

});
