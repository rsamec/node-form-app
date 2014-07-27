///<reference path='typings/node-form/node-form.d.ts'/>
///<reference path='typings/node/node.d.ts'/>
///<reference path='typings/i18n-2/i18n-2.d.ts'/>
///<reference path='typings/underscore/underscore.d.ts'/>
///<reference path='typings/moment/moment.d.ts'/>
///<reference path='models/vacationApproval/vacationApproval.d.ts'/>
var moment = require('moment');
var _ = require('underscore');
var i18n = require('i18n-2');
var Validation = require('node-form');
var VacationApproval = require('./models/vacationApproval/vacationApproval.js');

var local = new i18n({ locales: ['en', 'cz'], extension: '.json' });
local.setLocale('en');

//create test data
var data = {};

//business rules for vacation approval
var businessRules = new VacationApproval.BusinessRules(data, undefined);

//execute validation
businessRules.Validate();

var displayErrors = function (node, indent) {
    if (indent == 0) {
        console.log(Array(50).join("--"));
        console.log("-- Errors");
        console.log(Array(50).join("--"));
    }

    if (!node.HasErrors) {
        console.log(local.__("NoErrors"));
        return;
    }
    if (node.Children.length == 0) {
        //stopped recursion
        var msg = local.__(node.Name) + ":";

        _.each(node["Errors"], function (childError, key) {
            if (childError.HasError) {
                //display validation failure - process translateArgs
                var failure = childError.TranslateArgs;

                //custom messages
                if (failure["CustomMessage"] == undefined) {
                    //call standard translation
                    msg += failure == undefined ? failure.TranslateId : Validation.StringFce.format(local.__(failure.TranslateId), failure.MessageArgs);
                } else {
                    //call custom messages function - pass translation config and message args
                    msg += failure == undefined ? failure.TranslateId : failure["CustomMessage"](local.__(failure.TranslateId), failure.MessageArgs);
                }
                console.log(Array(indent + 1).join("--") + msg);
            }
        });
    } else {
        //log name
        console.log(Array(++indent).join("--") + local.__(node.Name) + ":");

        for (var i = 0, len = node.Children.length; i < len; i++) {
            if (node.Children[i].HasErrors)
                displayErrors(node.Children[i], indent);
        }
    }
};

//verify results
if (businessRules.Errors.HasErrors)
    displayErrors(businessRules.Errors, 0);

//fill some fields
data.Employee.FirstName = "John";
data.Employee.LastName = "Smith toooooooooooooooooooooooooo long";

data.Duration.From = moment(new Date()).add({ days: -1 }).toDate();
data.Duration.To = moment(new Date()).add({ days: -10 }).toDate();

//execute validation
businessRules.Validate();

//verify results
if (businessRules.Errors.HasErrors)
    displayErrors(businessRules.Errors, 0);

//fill all fields
data.Employee.LastName = "Smith";

data.Deputy1.FirstName = "John";
data.Deputy1.LastName = "Smith";
data.Deputy1.Email = "jsmith@gmail.com";

data.Duration.From = moment(new Date()).add({ days: 1 }).toDate();
data.Duration.To = moment(new Date()).add({ days: 4 }).toDate();

//execute validation
businessRules.Validate();

//verify results
displayErrors(businessRules.Errors, 0);
//# sourceMappingURL=index.js.map