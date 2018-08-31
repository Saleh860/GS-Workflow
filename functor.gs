/********************************************************************/
/*                     Functor Helpers                              */
/********************************************************************/

/********************************************************************
* Partial application helper
*
* Returns a function with all parameters fixed except the last one. 
* The fix values are given as an array x
* 
********************************************************************/
function _apply(fn,x) {
  l=x.length;
  switch(l) {
    case 1:
      return function (y) {return fn(x[0],y)};
    case 2:
      return function (y) {return fn(x[0],x[1],y)};
    case 3:
      return function (y) {return fn(x[0],x[1],x[2],y)};
    case 4:
      return function (y) {return fn(x[0],x[1],x[2],x[3],y)};
    case 5:
      return function (y) {return fn(x[0],x[1],x[2],x[3],x[4],y)};
  }
}

function _eq(x,y) {
  return x==y;
}

function _lt(x,y) {
  return y<x;
}

function _le(x,y) {
  return y<=x;
}

function _ne(x,y) {
  return x!=y;
}
function _id(x) {
  return x.id;
}
function _property(key){
  return function(x) {return Object.getOwnPropertyDescriptor(x, key).value;};
}
function _at(i,x) {
  return x[i];
}

function _or(predicate1, predicate2) {
  return function(x) {return predicate1(x) | predicate2(x)};
}

function _and(predicate1, predicate2) {
  return function(x) {return predicate1(x) & predicate2(x)};
}

function _compose(f,g) {
  return function(x){return f(g(x));}
}
function _between(a,b,x) {
  return a<=x && x<=b;
}

function _proxy(result) {
  return function() {
    return result;
  }
}


function testFunctorHelpers(testPassFunc) {
  //Log.enable();
  function ignore(caseFunc){}  
  Log.info(function () {return ['Functors', 'testing Functor Helpers']});
  test(function(){return [1,2,3,4,5,6,7,8,9].map( _apply(_le,[5])).toString()==
    [true,true,true,true,true,false,false,false,false].toString()},ignore);
  test(function(){return [1,2,3,4,5,6,7,8,9].map( _apply(_between,[4,8])).toString()==
    [false,false,false,true,true,true,true,true,false].toString()},ignore);
  test(function(){return _compose(_apply(_ne,[1]),_id) ({id:1}) == false},ignore);
  test(function(){return _compose(_apply(_ne,[0]),_property('id')) ({id:1}) == true},ignore);
  test(function(){return _compose(_apply(_eq,["hi"]),_property('msg')) ({id:1,msg:"hi"})},ignore);
}
