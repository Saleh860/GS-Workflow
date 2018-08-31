/****************************************************
Settings:
A special purpose Dataset for storing key-value pairs
With simplified interface:
get(key) returns the value corresponding to the given
         key
set(key,value) stores the value corresponding to the
         key. If the key doesn't exist, it is created
         If it exists, its value is updated.

Note that if the value is an object, e.g. Date object
the value returned by get can erronously be changed
thus affecting the result of later calls to get, 
without reflecting this change permanently in the 
settings sheet. To avoid this, we sacrifice a little
bit of efficiency and use serialized cached values
****************************************************/
function Settings(sheet, cacheEnabled) {
  if(sheet) {
    var ds = Dataset(sheet, 'Key');
    if(!ds || ds.getHeader().indexOf('Value')<0) {
      Log.error(_proxy(['Dataset','Can\'t load Settings because the sheet is missing a Value column']));
      return null;
    }
    
    var cacheGet;
    var cacheSet;
    
    if(cacheEnabled) {
      var cache = new Array();
      cacheGet= function(key){
        var found = cache.filter(function(r){
          return r.key == key;});
        if(found.length)
          return found[0];
        else
          return null;
      };
      cacheSet = function(key,value){
        var pair = cacheGet(key);
        if(!pair) {
          pair={key:key, value:value};
          cache.push(pair);
        }
        pair.value=value;
      };
    }
    else {
      cacheGet = function(key){return null;};
      cacheSet = function(key,value){};
    }
  
    var settings = {
      get: function (key) {
        var cached = cacheGet(key);
        if(cached) {
          Log.info(function() {return  ['Settings', 'Cache Hit ' + key]});
          return eval(cached.value);
        }
        else {
          var record = ds.getRecord(key);
          if(!record)
            return null;
          else {
            var value = record.getValue('Value');
            cacheSet(key,serialize(value));
            return value;
          }
        }
      },
      set: function (key, value) {
        var record = ds.getRecord(key);
        if(!record)
          record = ds.appendRecord(key);
        record.setValue('Value',value);
        cacheSet(key,serialize(value));
        Log.info(function() {return  ['Settings', 'Changed ' +key + " = " + value]});
      }
    };
    return settings;
  }
  else{
    //Self-test
    //Log.enable();
    Log.info(_proxy(['Test','Settings']));

    var settings = Settings(SpreadsheetApp.openById(
      '1VITxYdTsBnll-7a9QWvwg0H30TI4lIpEfthNfmyiZPk')
                            .getSheetByName('Settings'),
                            true);//Enable caching
    Log.info(_proxy(['Settings', 'LogFileId = ' + settings.get('LogFileId')]));
    Log.info(_proxy(['Settings', 'Again LogFileId = ' + settings.get('LogFileId')]));
  }
}

Log.disableTypes(['Settings']);
