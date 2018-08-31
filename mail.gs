function MailQueues(combinedMessageSubject) {
  if(combinedMessageSubject) {
    var recipients = new Array();
    var emails = new Array();
    
    return {
      
      //Send individual email message immediately
      sendEmail:function(recipient, subject, body, options) {
        Log.info(function(){
          return ['Mail', "Sending email:\nTo: "+recipient+
                  "\nSubject: " + subject + "\nBody: \n" + body ]});
        
        if(options)
          MailApp.sendEmail(recipient, subject, body, options);
        else
          MailApp.sendEmail(recipient, subject, body);
        
        Log.info(function(){
          return ['Mail', "Remaining Quota=" + 
                  MailApp.getRemainingDailyQuota().toString()+
                  " messages"]});
      },
      
      enqueueEmail: function(recipient, subject, body, options) {
        
        Log.info(function(){
          return ['Mail', "Enqueuing email:\nTo: "+recipient+
                  "\nSubject: " + subject + "\nBody: \n" + body] });
        var i=recipients.indexOf(recipient);
        if(i<0) {
          Log.info(function(){
            return ['Mail', 'New recipient queue created for '+recipient];});
          recipients.push(recipient);
          emails.push([{subject: subject, body:body, options:options}]);
        }
        else {
          emails[i].push({subject: subject, body:body, options:options});
        }
      },
      
      sendQueuedEmails: function() {
        
        if(emails.length != recipients.length) {
          Log.error(function(){return ['Mail', "Mail sending failed: Length of recipients array differs from length of emails array"]});
        }
        else {
          for(var i=0; i<emails.length; i++) {
            Log.info(function(){return ['Mail', "Found " + emails[i].length.toString() + " emails queued for " + recipients[i]]});
            
            if(emails[i].length==1) {
              
              this.sendEmail(recipients[i], emails[i][0].subject, emails[i][0].body, emails[i][0].options);
              
            } 
            else {
              var combinedMessage = emails[i].reduce(function(prev,email)
                                                     {
                                                       return {body: prev.body +
                                                               "\n\n----------------------------------------------" +
                                                               "\nSubject: " + email.subject + 
                                                               "\n\nBody:\n" + email.body,
                                                               attachments: prev.attachments.concat(!email.options?[]:(!email.options.attachments?[]:email.options.attachments))}}, 
                                                     {body:"\nPlease find a list of notifications below", attachments:[]});
              
              /* Todo: test attachments */
              
              this.sendEmail(recipients[i], combinedMessageSubject, 
                             combinedMessage.body, {attachments:combinedMessage.attachments,
                                                    name: "Automatic Emailer"});
              
            }
          }
          
          Log.info(function(){
            return ['Mail', "Total: " + emails.length + (emails.length>1?" emails sent":" email sent")]});
          
          recipients= new Array();
          emails = new Array();
        }
      },
    };
  }
  else {
    //Self-test
    //Log.enable();
    Log.info(_proxy(['Test', 'MailQueues']));
    var mailQueues= MailQueues('Message Digest');
    mailQueues.sendEmail = function(recipient, subject, body, options) {
      Log.info(function(){
        return ['Mail', "Sending email:\nTo: "+recipient+
                "\nSubject: " + subject + "\nBody: \n" + body ]});
    }
    mailQueues.enqueueEmail('sibrahemtu@gmail.com', 'First Message', 'Dear Sirs,\n\nThis is the text of the first message.\nRegards,\nSaleh\n');
    mailQueues.enqueueEmail('sibrahemtu@gmail.com', 'Second Message', 'Dear Sirs,\n\nThis is the text of the second message.\nRegards,\nSaleh\n');
    mailQueues.enqueueEmail('sibrahemtu@gmail.com', 'Third Message', 'Dear Sirs,\n\nThis is the text of the third message.\nRegards,\nSaleh\n');
    mailQueues.enqueueEmail('s.ibrahem@tu.edu.sa', 'First Message', 'Dear Sirs,\n\nThis is the text of the first message.\nRegards,\nSaleh\n');
    
    mailQueues.sendQueuedEmails();
  }
};

//Comment the following line or add Log.enableTypes(['Mail']) to log 
//detailed info about the operation of the Mail module
Log.disableTypes(['Mail']);
