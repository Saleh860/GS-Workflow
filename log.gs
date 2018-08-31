/********************************************************************/
/*                         Log Helpers                              */
/********************************************************************/

var Log = {
  /******** 
  If enabled == true, all log types are enabled by default
  Otherwise, all log types are disabled by default
  
  Logging is by default disabled, until "enable" is called
  ********/
  enabled: false,
  enableAllTypes: function () {},
  disableAllTypes: function () {},
  enableTypes: function (types) {},
  disableTypes: function (types) {},
  isTypeEnabled: function (type) {return false;},
  setLevel: function(level) {},
  isLevelEnabled: function(level) {return false;},
  log: function (level, strFunc) {},               
  info: function(func) {},
  warn: function(func) {},
  error: function(func) {},
  enableTestMode: function(level,type,strFunc){},
  disable: function(){},  
  
  //Enable logging
  enable: function (spreadsheetId){ 
    /******* the id of the spreadsheet file in which logs are to be
    stored if null, logs are not permanently stored       *****/

    //Internal data

    /* Function used to log Log object operation for verifying that Log is
    working perfectly. By default its an empty function. */
    var _test = function(level,type,desc) {};
      
    /********
    Exceptions: when enabled==true
    ********/
    var disabledTypes = new Array();
    
    /********
    Exceptions: when enabled==false
    ********/
    var enabledTypes = new Array();
    
    /********
    Supported log levels. When a log level is enabled, all lower levels
    are enabled as well.
    ********/
    var levels = ["INFO","WARN","ERROR"];
      
    /********
    Index of the enabled Log Level. This persumes all lower log levels
    ********/
    var levelIndex = 0;

    //Assume all types are enabled
    var enabled = true;
  
    /******* the Spreadsheet object in which logs are to be stored *****/
    var spreadsheet; 

    if(spreadsheetId) {
      try {
        if(Drive.Files.get(spreadsheetId).editable) {
          spreadsheet = SpreadsheetApp.openById(spreadsheetId);
        }
      }
      catch(e) {
        Logger.log('Failed to open Log sheet id=%s for editing',spreadsheetId);
      }
    }
    
    if(spreadsheet){
      Log.mandatory = function(level, logType, logDesc) {
        Logger.log('%s: %s\n%s', level, logType, logDesc);
        spreadsheet.appendRow([new Date(), level, logType, logDesc]);
      }
    } else {
      Log.mandatory = function(level, logType, logDesc) {
        Logger.log('%s: %s\n%s', level, logType, logDesc);
      }
    }
    

    /*********************************************************************
    * Make all log types enabled by default
    * Clear all exception lists
    * Only the exceptions added later on to logDisabledList is disabled
    *********************************************************************/
    Log.enableAllTypes = function() {
      enabled = true;
      enabledList = new Array();
      disabledList = new Array();
      _test(levels[0],'Log Types', 'Enable All');
    };

    /*********************************************************************
    * Make all log types disabled by default
    * Clear all exception lists
    * Only the exceptions added later on to logEnabledList are enabled
    *********************************************************************/
    Log.disableAllTypes=  function() {
      _test(levels[0],'Log Types', 'Disable All');
      enabled = false;  
      enabledList = new Array();
      disabledList = new Array();
    };

    /*********************************************************************
    * Add the given list of log types to the enabled exception list
    * Effective only if logging was disabled by a call to 
    * logDisableAllTypes()
    *********************************************************************/
    Log.enableTypes = function(types) {
      if(!enabled) {//If logging is generally disabled
        //Add exception to enabled types list
        types.forEach(function(type) {
          if(enabledTypes.indexOf(type)<0) {
            _test(levels[0],'Log Types', 'Adding enable exceptions to enable: ' + type);
            enabledTypes.push(type);
          }
        });
      } else { //If logging is generally enabled
        //Remove exception from disabled types list
        types.forEach(function (type) {
          var i = disabledTypes.indexOf(type);
          if(i>=0) {
            _test(levels[0],'Log Types', 'Removing disable exceptions to enable: ' + type);
            disabledTypes.splice(i,1);
          }
        });
      }
    };

    /*********************************************************************
    * Add the given list of log types to the disabled exception list
    * Effective only if logging was enabled by a call to 
    * logEnableAllTypes()
    *********************************************************************/
    Log.disableTypes = function(types)  {
      if(enabled) {//If logging is generally enabled
        //Add exception to disabled types list
        types.forEach(function(type) {
          if(disabledTypes.indexOf(type)<0) {
            _test(levels[0],'Log Types', 'Adding disable exceptions to disable: ' + type);
            disabledTypes.push(type);
          }
        });
      } else { //If logging is generally disabled
        //Remove exception from enabled types list
        types.forEach(function (type) {
          var i = enabledTypes.indexOf(type);
          if(i>=0) {
            _test(levels[0],'Log Types', 'Removing enable exceptions to disable: ' + type);
            enabledTypes.splice(i,1);
          }
        });
      }
    };

    /*********************************************************************
    * Check if a given log type is enabled
    * A log type is enabled if logging is enabled by default and the given
    * type is not in the disabled exception list 
    * OR when logging is disabled by default but the given type is in
    * the enabled exception list
    *********************************************************************/
    Log.isTypeEnabled=function(type) {
      _test(levels[0], 'Log Types', 'Checking log type ' + type + 
                 " ==> " + 
                 (((enabled & (disabledTypes.indexOf(type)<0)) |
        (!enabled & (enabledTypes.indexOf(type)>=0)))? "Enabled":"Disabled"));
      return (enabled & (disabledTypes.indexOf(type)<0)) |
        (!enabled & (enabledTypes.indexOf(type)>=0));
    };

    Log.setLevel = function(level) {
      var i = levels.indexOf(level);
      if(i<0)
        Log.mandatory(levels[2], 'Log Levels', "Invalid log level "+ level + 
                        ". Allowed levels are " + levels); 
      else {
        _test(levels[0], 'Log Levels', "Log level set to " + level); 
        levelIndex = i;
      }
    };

    Log.isLevelEnabled = function(level) {
      var requestedLevelIndex = levels.indexOf(level);

      return requestedLevelIndex >= levelIndex;
    };

    Log.log = function (level, strFunc) {
      if (Log.isLevelEnabled(level)) {
        var eventInfo = strFunc();
        if(Object.prototype.toString.call(eventInfo)=='[object String]') {
          if (Log.isTypeEnabled('Generic'))
            Log.mandatory(level, 'Generic', eventInfo);
        }
        else {
          if (Log.isTypeEnabled(eventInfo[0]))
            Log.mandatory(level, eventInfo[0], eventInfo[1]);
        }
      }
    };

    Log.info = function(strFunc) {
      Log.log(levels[0], strFunc);
    }
    
    Log.warn = function(strFunc) {
      Log.log(levels[1],strFunc);
    }
    
    Log.error = function(strFunc) {
      Log.log(levels[2],strFunc);
    };

    /*To run tests on the Log object, call Log.enableTestMode() which replaces
    the empty _test(...) function with mandatory(...) log function */
    Log.enableTestMode = function(){
      _test = Log.mandatory;
    };
    
    //Disable Logging
    Log.disable = function(){
      Log.enabled = false;
      Log.enableAllTypes = function () {};
      Log.disableAllTypes = function () {};
      Log.enableTypes = function (types) {};
      Log.disableTypes = function (types) {};
      Log.isTypeEnabled = function (type) {return false;};
      Log.setLevel = function(level) {};
      Log.isLevelEnabled = function(level) {return false;};
      Log.log = function (level, strFunc) {}; 
      Log.info = function(func) {};
      Log.warn = function(func) {};
      Log.error = function(func) {};
      Log.disable = function(){};
    };
  }
}

//Comment the following line, or call Log.disable, to disable all logs
Log.enable();

/*

function testLogHelpers() {
  Log.info(_proxy(['Test','Log']));
  Log.info(_proxy("This is a generic log entry with no event type information"));
  Log.info(_proxy( "This is multi-line\n\
information"));
  Log.info(_proxy(['Special Event Type','Event detailed information\ncan span multiple lines too'])) 

  Log.warn(_proxy(['Test',"This is a warning"]));
  Log.error(_proxy(['Test',"This is an error"]));
}

function testLogLevels() {
  Log.setLevel("INFO");
  testLogHelpers();
  Log.setLevel("WARN");
  testLogHelpers();
  Log.setLevel("ERROR");
  testLogHelpers();
}

function testLogTypes() {
  Log.enableTestMode();
  Log.disableAllTypes();
  testLogHelpers();
  Log.enableTypes(['Test','Generic']);
  testLogHelpers();
  Log.enableAllTypes();
  testLogHelpers();
  Log.disableTypes(['Test','Generic']);
  testLogHelpers();
}
*/
