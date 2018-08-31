/********************************************************************/
/*                     Workflow Process                             */
/********************************************************************/

/********************************************************************
 A workfolow is composed of states, transitions and actions 
 starting with an entry step and possibly finishing at an exit
 step. The transition from a state to another depends on certain 
 conditions defined by the process itself.
********************************************************************/


/********************************************************************/
/*                Workflow_states Object                            */
/* Members: 
           list: array of states
           get:  return a state given its id
           put:  add the given state to the list of states          */
/********************************************************************/
var Workflow = {
  states : {
    list: new Array(),
    get: function(key) {
      var s = this.list.filter(function(s){return s.id==key})[0];
      if(!s) s=this.list[0];//The first state is the default
      return s;
    },
    put: function(s){this.list.push(s)}
  },
  
  callbacks: {},

/********************************************************************/
/*                           State                                  */
/* Create a State object 
   Members:
           id
           name
           description
           transitions:  array of transitions leaving from this state
           next(record): returns the next state given the record
                         if no transition is possible, returns this
           transition(record): returns the transition corresponding
                         to the given record
*/
/********************************************************************/
  State:function (id, name, description) {
    var state = {id:id, name:name, description:description,
                 transitions: new Array(),
                 add:function(t){this.transitions.push(t)},
                 next:function(record) {
                   var x = this.transition(record);
                   return x? Workflow.states.get(x.to): this;
                 },
                 transition:function(record) {
                   return this.transitions.filter(function(t){
                     return t.condition(record);
                   })[0];
                 }
                };
  
    Workflow.states.put(state);
  
    return state;
  },

  Transition: function(from, condition, action, to) {
    var transition = {from:from,
                      fromState: Workflow.states.get(from),
                      condition:Object.getOwnPropertyDescriptor(Workflow.callbacks, condition).value,
                      action: function(record) {
                        Log.info(function(){return ['Workflow.Transition.Action', 
                                            'Taking action: '+ action ]});
                        Object.getOwnPropertyDescriptor(Workflow.callbacks, action).value(record);
                        record.setCurrentState(Workflow.states.get(to));
                      },
                      to: to,
                      toState: Workflow.states.get(to),
                      currentState:_proxy(Workflow.states.get(from)),
                      nextState:_proxy(Workflow.states.get(to))
                     };
    Workflow.states.get(from).add(transition);
    
    return transition;
  },

  /************************
  obj:
  spreadsheet: 
  statesSheetName: (optional)
  transitionsSheetName: (optional)
  callbacks: object containing callback functions 
  ************************/
  load: function(obj) {
    Workflow.callbacks=obj.callbacks;
    if(!obj.statesSheetName)obj.statesSheetName='States';
    if(!obj.transitionsSheetName)obj.transitionsSheetName='Transitions';
    var statesSheet = obj.spreadsheet.getSheetByName(obj.statesSheetName);
    statesSheet.getSheetValues(2, 1, 10, 3)
    .filter(function(record){return record[0]!='';})
    .map(function(record) {
      Workflow.State(record[0],record[1],record[2]);
    });
    
    var transitionsSheet = obj.spreadsheet.getSheetByName(obj.transitionsSheetName);
    transitionsSheet.getSheetValues(2, 1, 100, 4)
    .filter(function(record){return record[0]!='';})
    .forEach(function(record) {
      Workflow.Transition(record[0],record[1],record[2], record[3]);
    });
  }
};


var testWorkflowCallbacks = {
  lastTimestamp:0,

  RequestSubmitted: function (record){
  return true;
  },
  RepairDone: function (record){return true;},
  RepairDeclined: function (record){return true;},
  RepairProgress: function (record){return true;},
  RepairConfirmed: function (record){return true;},

 InitiateJobOrder: function (record){},
  RequestConfirmation: function (record){},
  NotifyProgress: function (record){},
  RequestConfirmation: function (record){},
  CloseJobOrder: function (record){},
  ReopenJobOrder:function (record){}
};

function testWorkflow() {
  Log.info(_proxy(['Test', 'Workflow']));

  Workflow.load({spreadsheet: SpreadsheetApp.openById('1wzYny_8b-c4HYMhhrA-ABjCMPOJeqwlXRvUZbu1ZbRg'), 
                callbacks: testWorkflowCallbacks });
  
  var record = {requestTimestamp:Date.now(), setCurrentState: function(state){}};
  
  //Testing
  testLogger.log(Workflow.states.get('Order').next(record).id);
}

