function TimestampTracker(settings, key) {
  if(settings) {
    var setting = key;
    
    /*
    The lastTimestamp that has already been processed before this instance 
    of the workflow was launched. Any more recent timestamp is considered new.
    */
    var lastTimestamp =  new Date(settings.get(setting));
    
    /*
    The latest timestamp seen during this activation of the workflow
    */
    var newLastTimestamp = lastTimestamp;
    
    Log.info(function(){return ['TimestampTracker','Tracking '+key + '='+lastTimestamp]});
    
    return {  
      /*
      Consider a given timestamp, and if it is new 
      (greater than the lastTimestamp), return true 
      if it is the greatest timestamp seen so far, record it as
      the newLastTimestamp. When the workflow activation is finished 
      this will become the new lastTimestamp 
      */
      isNew: function(timestamp) {
        Log.info(function(){return ['TimestampTracker','('+lastTimestamp+').isNew('+timestamp + ')='+(timestamp>lastTimestamp)]});
        if(timestamp>newLastTimestamp) 
          newLastTimestamp = new Date(timestamp);
        return timestamp && timestamp > lastTimestamp;
      },
      
      /*
      update the setting to the latest timestamp seen so far
      */
      update: function() {
        if(newLastTimestamp!=lastTimestamp) {
          Log.info(function(){return ['TimestampTracker','Updating '+newLastTimestamp]});
          settings.set(setting, newLastTimestamp);
          lastTimestamp = newLastTimestamp;
        }
      },    
    };
  }
  else {
    //Self-test
    Log.info(_proxy(['Testing', 'TimestampTracker']));
    var settings = Settings(SpreadsheetApp.openById(
      '1VITxYdTsBnll-7a9QWvwg0H30TI4lIpEfthNfmyiZPk')
                            .getSheetByName('Settings'),
                            true);//Enable caching
    var tsTracker = TimestampTracker(settings,'LastTimestamp');
    var ts = settings.get('LastTimestamp');
    test(function(){ts.setTime(ts.getTime()-1000);
                    return (!tsTracker.isNew(ts))});
    test(function(){ts.setTime(ts.getTime()+1000);
                    return (!tsTracker.isNew(ts))});
    test(function(){ts.setTime(ts.getTime()+1000);
                    return (tsTracker.isNew(ts))});
    test(function(){return (tsTracker.isNew(ts))});
    test(function(){ts.setTime(ts.getTime()+1000);
                    return (tsTracker.isNew(ts))});
    test(function(){tsTracker.update(); 
                    return (!tsTracker.isNew(ts))});
    test(function(){ts.setTime(ts.getTime()+1000);
                    return (tsTracker.isNew(ts))});
    
    test(function(){return (tsTracker.isNew(ts))});
  }
}
Log.disableTypes(['TimestampTracker']);

/*
function testTimestamp() {
  Configuration.loadSettings(SpreadsheetApp.openById('18O3TytlYVNEgdLLU3GwRlQKUxMDzFwnk9PU32RpMyxw'));
  tsTracker = TimestampTracker('lastTimestamp');
  tsTracker.update();
}*/
