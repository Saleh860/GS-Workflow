/********************************************************************
                      Concurrency Control
Leverage script-scoped cache to implement mutually exclusive 
operations. Mutually exclusive functions marked with the same key
cannot be executed simultaneously. Instead, the first function to
be called through the mutex must finish before the next can start
execution.
See the test function below for an example of how to use mutexes

********************************************************************/
var Concurrency = {
  mutexFunc: function(key, expirationInSeconds, func) {
    var mutexKey = 'Mutex:'+key;
    var svc = CacheService.getScriptCache();
    var signature = Math.round(Math.random()*1000000000000);
    var entered = false;
    function enter(){
      if(!entered) {
        for(var i=1; i<expirationInSeconds-1; i++) {
          if(!svc.get(mutexKey)) {
            svc.put(mutexKey, signature, expirationInSeconds);
            Log.info(_proxy(['Concurrency','Entering mutex '+ key + ',' + signature]));
          }
          if(svc.get(mutexKey)==signature){
            entered = true;
            break;
          }
          Log.info(_proxy(['Concurrency','Waiting for mutex '+ key + ',' + signature]));
          Utilities.sleep(1000); //wait one second, then try again
        }
      }
      else {
        Log.error(_proxy(['Concurrency','Illegal call to enter() while mutex is already entered']));
      }
      if(!entered) throw "Can't enter mutex";
    }
    function leave(){
      if(entered) {
        var currentSignature= svc.get(mutexKey);
        if(currentSignature==signature){
          svc.remove(mutexKey);
          entered = false;
          Log.info(_proxy(['Concurrency','Leaving mutex '+ key + ',' + signature]));
        }
        else {
          Log.error(_proxy(['Concurrency','Illegal call to leave() by signature ' + 
                            signature + ', while signature ' + currentSignature + 
                            ' entered the same mutex']));
        }
      } 
      else {
        Log.error(_proxy(['Concurrency','Illegal call to leave() by signature '+ signature +', while mutex is not entered yet']));
      }
      if(entered)
        throw "Can't leave mutex";
    }
    
    //Main body of mutex function
    enter();
    func();
    leave();
  }
};

function testConcurrency() {
  Log.enable('11XhVGezKirNpCwLCNhCl_88fVUz8BKLndhyCGL0HDnA');
  function testOperation(){
    var sheet = SpreadsheetApp.openById('11XhVGezKirNpCwLCNhCl_88fVUz8BKLndhyCGL0HDnA');
    var cell = sheet.getSheets()[1].getRange(1, 1);
    var i =cell.getValue(); 
    Log.info(_proxy(['Test','read  i='+i]));
    Utilities.sleep(3000);
    cell.setValue(i+1);
    Log.info(_proxy(['Test','write i='+(i+1)]));
  }
  
  //Without concurrency control
  //testOperation();
  //With concurrency control 
  Concurrency.mutexFunc('Test', 10, testOperation);
  
}
