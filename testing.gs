/********************************************************************/
/*                         Test Helpers                              */
/********************************************************************/

/********************************************************************
* Evaluate the given test case and if it returns false, print out 
* the code of the failed test case.
* A successful test case function must return true. 
********************************************************************/
function test(caseFunc, passFunc, failFunc) {
  if(caseFunc) {
    //Execute test case
    var result;
    var errorMsg='';
    try {
      result = caseFunc();
    } catch(e) {
      result = false;
      errorMsg = 'An exception occurred: ' + e.toString();
    }
    if(!result) {
      //If failed (returned false), execute failFunc 
      //Or the default Test.failFunc if no failFunc was supplied
      if(!failFunc) { 
        failFunc = function(caseFunc) {
          Log.error(function () {
            return ["Test Failed", errorMsg + '\n' + 
                    caseFunc.toString()]}); 
        };
      }
      failFunc(caseFunc);
    }
    else {
      //If succeeded (returned true), execute passFunc 
      //Or the default Test.passFunc if no passFunc was supplied
      if(!passFunc) { 
        passFunc = function(caseFunc) {
          Log.info (function () {return ["Test Passed", caseFunc.toString()]}); 
        };
      }
      passFunc(caseFunc);    
    }
  }
  else {
    //Self-tests mode
//    Log.enable();
    Log.info(function () {return ['Test','Testing']});
    
    test(function(){return true;});
    
    test(function(){
      x='Should fail';
      return false;});
    
    test(function(){
      x='Should fail';
      throw {msg:'An exception was thrown', 
             toString:function(){return this.msg;}};
      return true;
    });

    test(function(){
      x='Should fail';});
    
    test(
      function(){
        x="ignore 1";
        return true;
      }, 
      function (caseFunc){ //test pass handler
        //ignore
      });
    
    test(
      function(){
        x="ignore 2";
        return true;}, null,
      function (caseFunc){ //test fail handler
        //ignore
      });
  }
}

//Comment this line to display successful test results
Log.disableTypes(['Test Passed']);
