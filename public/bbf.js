$(function(){

  // Constants
  var BUTTONS_PER_TRAY = 20;
  var NUM_TRAYS = 4;

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

  // Get the user's photo URL
  var gravatarUrl = function(email) {
    var trimmed = $.trim(email).toLowerCase();
    return 'http://www.gravatar.com/avatar/' + MD5(trimmed) + '.jpg';
  };

  // Show the users photo, save to localStorage, and make global
  var showPhoto = function(userName, photoUrl) {
    $('#name').val(userName);
    $('#photo').attr('src', photoUrl).css({display:'inline'});
    localStorage.photoUrl = photoUrl;
    localStorage.userName = userName;
    window.photoUrl = photoUrl;
  }


  // Process the user name into their photo URL
  $('#begin').click(function(){
    var userName = $('#name').val().trim(),
        nameType = null;

    // Get the user name and
    if (!userName) {
      return;
    }

    // Is it an url to a photo?
    if (userName.match(/^http[s]?:\/\//i)) {
      return showPhoto(userName, userName);
    }

    // It's a twitter name if it starts with a @
    if (userName.match(/^@/)) {
      userName = userName.substr(1);
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

    // Tell the backend the button was pushed
    BBFMonitor.control('findPhotoUrl', {type: nameType, name: userName}, function(err, photoUrl){
      if (err) {
        alert('Error while finding user photo: ' + JSON.stringify(err));
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
