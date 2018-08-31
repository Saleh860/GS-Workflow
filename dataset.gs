/************************************************************
Create a Dataset object containing records from a given sheet
and the given columnName as the row key
Parameters:
    sheet:   SpreadsheetApp.Sheet containing the dataset
    keyName: header of column containing the key used to 
            identify rows

Methods:
    getName: Return dataset name (sheet name)
    
    getHeader: Return the column headers
    
    getKeys: Return the key identifiers for all records
    
    getRecord(key) : Return the record with the given key 
  
    appendRecord(key): Append a new record at the end of 
        the dataset, give it a new key and return the 
        newly added record. If no key is given, the max.
        key is incremented by 1 and used instead. 
    
    selectRecords(predicate): Return an array of records 
        satisfying the given predicate

************************************************************/
function Dataset(sheet, keyName) {
  if(sheet) {
    //private functions
    
    /**********************************************************
    Read a row of the sheet, given row number 
    The row number is added to the beginning of the array, 
    so that sheet column numbers coincide with array indexes 
    **********************************************************/
    var loadRow=function (i) {
      
      var row =  sheet.getSheetValues(i, 1, 1, 
                                      sheet.getMaxColumns())[0];
      
      //Add row[0] = row number
      row.unshift(i); 
      
      return row;
    }
    
    
    
    /**********************************************************
    Read a column of the sheet, given the column number 
    The column number is added to the beginning of the array, 
    so that sheet row numbers coincide with array indexes 
    **********************************************************/
    var loadCol=function (j) {
      var col = sheet.getSheetValues(
        1, j, sheet.getMaxRows(), 1).map(function(a){return a[0]});
      
      //Add col[0]=null
      col.unshift(j);
      
      return col;
    }
    
    /**********************************************************
    Remove unused cells from the end of the given array 
    **********************************************************/
    var trim=function (a) {
      
      var n= a.length-1;
      
      while(!a[n]) n--;
      
      return a.slice(0,n+1);
    }
    
    /**********************************************************
    Initialize dataset: Load sheet header, i.e. array of column
    header values, with the 'rowNumber' at header[0].
    **********************************************************/
    var header=trim(loadRow(1));
    
    var keyCol = header.indexOf(keyName);
    if(keyCol<0) {
      Log.error(_proxy(['Dataset','Can\'t open dataset. Key column "'+
                        keyName+'" not found ']));
      return null;
    }
    
    //Load key values and link them to sheet rows
    var keys= trim(loadCol(keyCol)); 
    keys[0]=null; keys[1]=null;
    
    var lastKey = keys.reduce(function(x,y){return y>x?y:x},0);
    
    /**********************************************************
    Make a record out of the given values
    values[0] must contain the row number 
    **********************************************************/
    var makeRecord= function (values) {
      var i = values[0];
      return {
        /**********************************************************
        Return the field value corresponding to the column name
        **********************************************************/
        getValue: function(columnName) {
          var j = header.indexOf(columnName,1);
          if(j>0)
            return values[j];
          else {
            Log.warn(function(){return [
              'Dataset.Record.getValue',
              'Column {' +columnName + 
              '} doesn\'t seem to exist in dataset {' +
              sheet.getName() + '}\r\nReturning null'
            ]});
            return null;
          }
        },
        
        getFormula: function(columnName) {
          var j = header.indexOf(columnName,1);
          if(j>0)
            return sheet.getRange(i,j).getFormula();
          else {
            Log.warn(function(){return [
              'Dataset.Record.getFormula',
              'Column {' +columnName + 
              '} doesn\'t seem to exist in dataset {' +
              sheet.getName() + '}\r\nReturning null'
            ]});
            return null;
          }
        },
        
        /**********************************************************
        Set the field value corresponding to the column name
        **********************************************************/
        setValue: function(columnName, value) {
          var j = header.indexOf(columnName,1);
          if(j>0) {
            values[j]=value;
            sheet.getRange(i,j).setValue(value);
          } else {
            Log.warn(function(){return [
              'Column Dataset.Record.setValue',
              '{' + columnName + 
              '} doesn\'t seem to exist in dataset {' +
              sheet.getName() + '}\r\nValue not set.'
            ]});
          }
        },
        rowNumber: i,
        key: values[keyCol],
      };
    }
    
    //Return the Dataset object
    var ds = {   
      /**********************************************************
      Return dataset name (sheet name)
      **********************************************************/
      getName: function() {
        return sheet.getName();
      },
      
      /**********************************************************
      Return the column headers 
      **********************************************************/
      getHeader: function() { 
        return header.slice(1,header.length);
      },
      
      /**********************************************************
      Return the key identifiers for all records 
      **********************************************************/
      getKeys: function() {
        return keys.slice(2, keys.length);
      },
      
      
      /**********************************************************
      Return the record corresponding to the given key
      **********************************************************/
      getRecord:function (key) {
        var i = keys.indexOf(key);
        if(i<0) return null;
        
        var values = loadRow(i).slice(0,header.length);
        return makeRecord(values);
      },
      
      /**********************************************************
      Append a new record at the end of the dataset, give it a 
      new key and return the newly added record
      **********************************************************/
      appendRecord: function(key) {
        if(!key) {
          lastKey++;
          key = lastKey;
        }
        var values=new Array(header.length);
        
        //New row number
        values[0]= keys.push(key)-1;
        
        var newRecord = makeRecord(values);
        newRecord.setValue(keyName,key);
        
        return newRecord;
      },
      /********************************************************
      Return an array of records satisfying the given predicate
      ********************************************************/
      selectRecords: function(predicate) {
        var records = new Array(0);
        var values = sheet.getSheetValues(
          2, 1, keys.length-2, header.length-1);
        for(var i=0; i<values.length; i++)
          values[i].unshift(i+2); //Row number
        return values.map(makeRecord).filter(predicate);
      },
    }; 
    
    /********************************************************
    Dump dataset name, column names and records as a string
    array
    ********************************************************/
    ds.serialize = function() {
      var header = ds.getHeader();
      var keys = ds.getKeys();
      return ['Dataset: ' + ds.getName()]
      .concat(
        keys.map(function(key){
          return serialize(header.map(function(col){
            return ds.getRecord(key).getValue(col)}));
        }));
    }
    
    return ds;
  }
  else {
    //Self-test
    //Log.enable();
    Log.info(_proxy(['Test','Dataset']));
    var dataset = Dataset(
      SpreadsheetApp.openById('1my33x4mJmcCzMdRh34oDmMunLLZi70-LEpXqrFmeWEs')
      .getSheetByName('Sheet1'), 'Timestamp');
    
    var records = dataset.selectRecords(function(record){
      return record.getValue('Timestamp').getTime()<Date.parse('6/7/2018 4:21:22');
    });
    
    records.forEach(
      function(record){
        Log.info(_proxy(['Dataset',record.getValue('Timestamp')]));
      });
    
    Log.info(_proxy(['Dataset',dataset.serialize()]));
  }
}
//Disable the following line to display detailed informtion about Dataset operation
Log.disableTypes(['Dataset']);
