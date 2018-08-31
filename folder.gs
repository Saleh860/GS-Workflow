/*********************************************************************
* Folder object container with delayed evaluation
* 
* has two members:
* getId() returns the Id
* getObj() returns the DriveApp object
*********************************************************************/
function Folder(obj){
  
  //Construct a non-existing null folder object;
  function NullFolder(){
    result.getId=function(){return null;}
    result.getObj=function(){return null;}
    result.getUrl=function(){return null;}
    result.exists=function(){return false;}
  }
  
  //Construct folder object given file id
  function FromId(id) {
    result.getId=function(){return id};
    result.getUrl=function(){
      return 'https://drive.google.com/drive/folders/'+id;
    }
    result.getObj= function(){
      var folder = DriveApp.getFolderById(obj);
      result.getObj=function(){return folder;}
      result.exists=function(){return !folder.isTrashed();}
      return folder;
    }
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
  
  //Construct folder object given DriveApp.Folder object
  function FromFolder(folder){
    result.getId=function(){
      var id = folder.getId();
      result.getId=function(){return id;};
      return id;
    };
    result.getUrl=function(){
      var url = folder.getUrl();
      result.getUrl=function(){return url;};
      return url;
    };
    result.getObj=function(){return folder;}; 
    result.exists = function() {
      if(!folder) return false;
      try {
        return !folder.isTrashed();
      } 
      catch(e) {
        return false;
      }
    }
  }
  
  var result= new Object();
  
  if(!obj) { //Construct empty Folder object
    NullFolder();
  }
  else if(Object.prototype.toString.call(obj)== '[object String]') {
    FromId(obj);
  } 
  else {
    FromFolder(obj);
  }
  
  result.getName = function(){return result.getObj().getName();}
  
  result.getOwnerEmail = function(){
    return result.getObj().getOwner().getEmail();
  }
  
  result.getFileByName = function(fileName) {
    var it = result.getObj().getFilesByName(fileName);
    if(it.hasNext())
      return File(it.next());
    else
      return File(null);
  }
  
  /********************************************************************
  * Open the first subfolder with the given subfolderName from within 
  * the given folder. If no subfolder with the given name can
  * be found one should be created.
  *
  * folder is Folder object
  * subfolderName is a String
  *
  * returns Folder object of the subfolder
  ********************************************************************/
  result.openCreateFolder = function(subfolderName) {
    var folder;
    var it = result.getObj().getFoldersByName(subfolderName);
    if (it.hasNext()) {
      folder = Folder(it.next());
    } else {
      folder = Folder(result.getObj().createFolder(subfolderName));
    } 
    return folder;
  };
  
  /********************************************************************
  * open the folder with the given path from within the 
  * given folder. If the path doesn't exist, it is created
  *
  * folder: Folder object
  * path : String[]
  *
  * returns Folder object of the opened or created folder
  *         or null if path can't be created
  ********************************************************************/
  result.openCreatePath = function(path) {    
    var folder = result;
    //Walk the path to find the target folder
    for(var i=0; i<path.length; i++) {
      var folder = folder.openCreateFolder(path[i]);
      if (!folder) {
        Log.error(function () {return ['Folder',"Can't create folder " + path[i] + " within folder " + folder.getObj().getName()]}) ;
        return null;
      }
    }
    return folder;
  }
  
  return result;
}

function Folder_SelfTest() {
  //Run self-test
  //Log.enable();
  testPassFunc=function(caseFunc){};
  Log.info(function () {return ['Test',"Folder"]}); 
  
  var folder1 =Folder('1F0O3X3Dbw3mCfDbmBUdN3qvbfdwuani1');  //Review
  folder1.exists();
  test(function(){return folder1.exists();});
  
  var folder2 = Folder(DriveApp.getFolderById('1F0O3X3Dbw3mCfDbmBUdN3qvbfdwuani1'))
  folder2.exists();
  test(function(){return folder2.exists();});
  
  var t=function () {
    var newFolder;
    test(function(){
      newFolder=folder1.openCreateFolder('Test123');
      return newFolder.getObj().getName()=="Test123"},testPassFunc);
    if(newFolder) folder1.getObj().removeFolder(newFolder.getObj());}; 
  t();
  
  t=function () {
    var newFolder;
    test(function(){
      newFolder=folder1.openCreatePath(['Test123','Test321']);
      return (newFolder.getObj().getName()=="Test321" &&
              newFolder.getObj().getParents().next().getName()=='Test123')},testPassFunc);
    if(newFolder) {
      var p = newFolder.getObj().getParents().next();
      p.removeFolder(newFolder.getObj());
      folder1.getObj().removeFolder(p);}}; 
  t();
}
