/********************************************************************/
/*                      File/Folder Helpers                         */
/********************************************************************/

/*********************************************************************
* File object container with delayed evaluation
* 
* has two members:
* getId() returns the Id
* getObj() returns the DriveApp object
*********************************************************************/
function File(obj){
  var result= new Object();
  
  //Construct a non-existing null File object;
  function NullFile(){
    result.getId=function(){return null;}
    result.getObj=function(){return null;}
    result.exists=function(){return false;}
  }

  //Construct File object given file id
  function FromId(id) {
    result.getId=function(){return id};
    result.getObj= function(){
      var file = DriveApp.getFileById(id);
      result.getObj=function(){return file;}
      result.exists=function(){return !file.isTrashed();}
      return file;
    };
    result.exists = function(){
      try{
        result.getObj();
        return result.exists();
      }
      catch(e){
        return false;
      }
    }
  }
  
  //Construct File object given DriveApp.Folder object
  function FromDriveAppFile(file){
    result.getId=function(){
      var id = file.getId();
      result.getId=function(){return id;};
      return id;
    };
    result.getObj=function(){return file;}; 
    result.exists = function() {
      if(!file) return false;
      try {
        return !file.isTrashed();
      }
      catch(e) {
        return false;
      }
    }
  }
  
  if(!obj) {  //If no argument was given return a non-existing file
    NullFile();
  }
  else if(Object.prototype.toString.call(obj)== '[object String]') {
    FromId(obj);
  }
  else {
    FromDriveAppFile(obj);
  };
  
  result.getName = function(){return result.getObj().getName();}

  result.getUrl = function() {return result.getObj().getUrl();};
    
  /********************************************************************
  * Check whether the given folder is already a parent of 
  * the given file 
  ********************************************************************/
  result.isInFolder = function(folder) { 
    var it = result.getObj().getParents();
    while(it.hasNext()){
      if(it.next().getId()==folder.getId()) {
        return true;
      }
    }
    return false;
  };
  
  /********************************************************************
  * Add the given file to the given folder.
  *
  * returns nothing
  ********************************************************************/
  result.addToFolder = function(folder){ 
    Log.info(function () {return ['File',"Adding file " + 
                                  result.getObj().getName() + 
                                  " to folder "  + 
                                  folder.getObj().getName()]});
    folder.getObj().addFile(result.getObj());  
  };
  
  /********************************************************************
  * Remove the given file from the given folder 
  * If the folder isn't a parent of the file, the operation is ignored
  *
  * file   : File object
  * folder : Folder object, 
  *
  * returns true, if the folder was a parent to the file  
  *     and false if the folder wasn't a parent in the first place 
  ********************************************************************/
  result.removeFromFolder=function(folder) {
    Log.info(function () {return ['File',"Removing file " + 
                                  result.getObj().getName() + 
                                  " from folder " + 
                                  folder.getObj().getName()]});
    return folder.getObj().removeFile(result.getObj())!=null;
  };
  
  /********************************************************************
  * Remove the given file from all its parent folders 
  *
  * file   : File object
  *
  * returns null
  ********************************************************************/
  result.removeFromAllFolders= function()  {
    Log.info(function () {return ['File',"Removing file " + 
                                  result.getObj().getName() +
                                  " from all its parent folders"]});
    var it = result.getObj().getParents();
    while(it.hasNext())
      it.next().removeFile(result.getObj());
  };
  
  /********************************************************************
  * remove the given file from the given folder and put it in
  * the given folder. If "fromFolder" is not given, the file is
  * removed from all parents (not recommended).
  *
  * file: File object
  * toFolder: Folder object
  * fromFolder: Folder object
  *
  * returns null
  ********************************************************************/
  result.moveToFolder = function(folder, fromFolder) {
    if(fromFolder) {
      result.removeFromFolder(fromFolder);
    } 
    else {
      result.removeFromAllFolders();
    }
    result.addToFolder(folder);
  };
  
  /********************************************************************
  * Rename the given file to the given newFileName.
  * If the file is already named correctly, it is left unchanged 
  ********************************************************************/
  result.rename=function(newFileName){
    if(newFileName != result.getObj().getName()) {
      Log.info(function () {return ['File',result.getObj().getName() + " will be renamed to " + newFileName]});
      result.getObj().setName(newFileName);
      return true;
    } 
    else { 
      Log.info(function () {return ['File',result.getObj().getName() + " is correctly named already!"]});
      return false;
    }
  }
  
  /********************************************************************
  * Add a given file to the given path under the given main folder 
  * The path contains the names of subfolders
  *  
  * Target path is therefore:
  * <folder>/path[0]/path[1]/.../<fileId>
  * 
  * file is File object
  * folder is Folder object 
  * path is String[]
  *
  * returns true if successful and false otherwise. 
  *
  ********************************************************************/
  result.addFileToPath = function(folder, path) {
    Log.info(function(){return ['File', "Inserting file " + result.getObj().getName() + 
                                "into folder " + [folder.getObj().getName()].concat(path).join("/")];});
    
    folder = folder.openCreatePath(path);
    
    if (folder) {
      result.addFileToFolder(folder);
      return true;
    }
    else
      return false;
  }
  
  
  return result;
}

function File_SelfTest() {
  //Self-test
  //Log.enable();
  testPassFunc=null;//function(caseFunc){};
  Log.info(function () {return ['Test',"File"]}); 
  var file0 = File('1Pp-XeNHfALSE84IF60pVr5VTxFxNMUJ7gsg2fSHEkE4'), 
      file1 = File('12O1nqDpHysiYMlbjesT57Bx0wL3WBJQ8F1XbceYNA_c'); //Test
  
  var folder0 =Folder('1501qptdSIwAMfUPkIKaD4oiptAJz6pLC'),  //Scripts
      folder1 =Folder('1F0O3X3Dbw3mCfDbmBUdN3qvbfdwuani1');  //Review
  
  test(function(){return file0.isInFolder(folder0)==true},testPassFunc); 
  test(function(){return !file0.isInFolder(folder1)},testPassFunc); 
  test(function(){return !file0.isInFolder(
    Folder('Any invalid fileId, because of lazy evaluation the folder '+
           'object is never checked for validity. Only its id is used '+
           'for checking if it is a parent of file0'))},testPassFunc); 
  
  test(function(){return (file1.isInFolder(folder0) && 
                          !file1.isInFolder(folder1))},testPassFunc);
  test(function(){ file1.moveToFolder(folder1);
                  //Utilities.sleep(60000);//Allow file move to complete
                  return (!file1.isInFolder(folder0) &&
                          file1.isInFolder(folder1))},testPassFunc); 
  
  test(function(){ file1.moveToFolder(folder0);
                  //Utilities.sleep(60000);//Allow file move to complete
                  return (file1.isInFolder(folder0) && 
                          !file1.isInFolder(folder1))},testPassFunc);
  
  test(function(){file1.rename('Test1');
                  return file1.getName()=="Test1"},testPassFunc);
  test(function(){file1.rename('Test1.doc'); 
                  return file1.getName()=="Test1.doc"},testPassFunc);
  test(function(){file1.rename('Test'); 
                  return file1.getName()=="Test"},testPassFunc);
  
  test(function(){return folder1.openCreateFolder('Scripts').getId()==folder0.getId()},testPassFunc);
  
}

//Comment the following line, or call Log.enableTypes(['File'])
//to show detailed log info of the File object 
Log.disableTypes(['File']);
