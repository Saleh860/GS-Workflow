/********************************************************************
* The file and folder Ids of all sheets and folders referenced by
* the script. The standard file names and folder names too.
* Basically this is a one stop global configuration function.
* usually called in the following fashion:
*
* config().courseFolderId 
*
********************************************************************/
var Configuration = {
  name: 'Workflow configuration object',
  databaseId: '18O3TytlYVNEgdLLU3GwRlQKUxMDzFwnk9PU32RpMyxw',
  logSpreadsheetId: '1P8EhMH1i1oO6u-crpS0Ec44-QTp3APgixKLJ9nljwzc',
  settings:null,

/********************************************************************
* load settings from spreadsheet
********************************************************************/
  loadSettings: function (spreadsheet, sheetname) {
    Log.info(function(){return  ['Entering Function',"loadSettings"]});
    if(!spreadsheet) spreadsheet = SpreadsheetApp.openById(Configuration.databaseId);
    if(!sheetname) sheetname = "Settings";
    var settingsSheet = spreadsheet.getSheetByName(sheetname);
    var keys = settingsSheet.getSheetValues(2, 1, 100, 1)
    .filter(function (row){return row[0]!=""})
    .map(function (row) {return row[0];});
  
    //Assuming no blank lines
    var values = settingsSheet.getSheetValues(2, 2, keys.length, 1)
    .map(function (row) {return row[0];});
  
    Configuration.settings =  {
      get: function (name) { 
        var value = null;
        var i = keys.indexOf(name);
        if(i<0)
          return null;
        else
          return values[i];
        return value;
      },
      set: function (name, value) {
        var i = keys.indexOf(name);
        if(i<0)
          return null;
        else {
          values[i]=value;
          settingsSheet.getRange(i+2, 2).setValue(value);
          Log.info(function() {return  ['Setting Changed', name + " = " + value]});
        }
      }
    };
    Log.info(function(){return  ['Leaving Function',"loadSettings"]});
  }
};

/*
function testConfig() {
  //Log.enable(Configuration.spreadsheetId);
  Configuration.loadSettings()
  Log.info(_proxy(['Testing',Configuration.settings.get('Last Timestamp')]));
}*/
