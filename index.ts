///<reference path='typings/business-rules-engine/business-rules-engine.d.ts'/>
///<reference path='typings/node/node.d.ts'/>
///<reference path='typings/i18n-2/i18n-2.d.ts'/>
///<reference path='typings/underscore/underscore.d.ts'/>
///<reference path='typings/moment/moment.d.ts'/>
///<reference path='typings/q/q.d.ts'/>

///<reference path='node_modules/br-vacation-approval/business-rules.d.ts'/>


import _ = require('underscore');
import Q = require('q');
var moment = require('moment-range');
import i18n = require('i18n-2');
var Validation = require('business-rules-engine');
var VacationApproval = require('br-vacation-approval');
var Utils = require("business-rules-engine/commonjs/Utils");

var en = require('business-rules-engine/commonjs/i18n/messages_en.js');
var cz = require('business-rules-engine/commonjs/i18n/messages_cs.js');
var de = require('business-rules-engine/commonjs/i18n/messages_de.js');



/**
 * @name Custom async property validator example
 * @description
 * Return true for valid BranchOfBusiness, otherwise return false.
 *
 * To create a async custom validator you have to implement IAsyncPropertyValidator interface.
 * Async custom validator must have property isAsync set to true;
 */
class FakeVacationDeputyService {

    /**
     * It checks first deputy in the vacation request with list of all approved vacations that they are not in conflict.
     * @param an {any} vacation request to check
     * @returns {boolean} return true for valid value, otherwise false
     */
    isAcceptable(data:VacationApproval.IVacationApprovalData):Q.Promise<boolean> {
        var deferred = Q.defer<boolean>();

        setTimeout(function () {

            //check if there is something to validate -> check required data for validation
            var namesAreValid = data.Deputy1 !== undefined && data.Deputy1.FirstName !== undefined && data.Deputy1.LastName !== undefined;
            var datesAreValid = _.isDate(data.Duration.From) && _.isDate(data.Duration.To);
            if (!namesAreValid || !datesAreValid) {
                //nothing to validate
                deferred.resolve(true);
                return;
            }

            //fetch items form somewhere - eg. db
            var items =
                [
                    { "approvedDays": [moment(), moment().add('days', 1).startOf('days')], "fullName": "John Smith" },
                    { "approvedDays": [moment().add('days', 1).startOf('days'), moment().add('days', 2).startOf('days')], "fullName": "Paul Neuman" },
                ];

            //find out range
            var durationRange = moment().range(data.Duration.From, data.Duration.To);

            //validation
            var hasSomeConflicts = _.some(items, function (item) {
                return (item.fullName == (data.Deputy1.FirstName + " " + data.Deputy1.LastName) &&
                    _.some(item.approvedDays, function (approvedDay) {
                        return durationRange.contains(approvedDay.startOf('days'));
                    }));
            });
            deferred.resolve(!hasSomeConflicts);
        }, 1000);

        return deferred.promise;
    }
}


//prepeare localization
var local  = new i18n({
    locales:['en','cz','de'],
    directory: 'node_modules/br-vacation-approval/i18n',
    extension:'.json'});

_.extend(local.locales['en'],en.ValidationMessages);
_.extend(local.locales['cz'],cz.ValidationMessages);
_.extend(local.locales['de'],de.ValidationMessages);

//friendly-displayed errors
var displayErrors = function(node, indent) {

    if (indent == 0){
        console.log(Array(50).join("--"))
        console.log("-- " + local.__("Errors"));
        console.log(Array(50).join("--"))
    }

    if (!node.HasErrors) {
        console.log(local.__("NoErrors"));
        return;
    }
    if (node.Children.length ==0) {

        //stopped recursion
        var msg = local.__(node.Name) + ":";

        _.each(node["Errors"], function (childError:Validation.IValidationFailure, key:string) {
            if (childError.HasError) {

                //display validation failure - process translateArgs
                var failure:Validation.IErrorTranslateArgs = childError.TranslateArgs;
                if (failure == undefined) {
                    msg += childError.ErrorMessage;
                }
                else {
                    //custom messages
                    if (failure["CustomMessage"] == undefined) {
                        //call standard translation
                        msg += failure == undefined ? failure.TranslateId : Utils.StringFce.format(local.__(failure.TranslateId), failure.MessageArgs);
                    }
                    else {
                        //call custom messages function - pass translation config and message args
                        msg += failure == undefined ? failure.TranslateId : failure["CustomMessage"](local.__(failure.TranslateId), failure.MessageArgs);
                    }
                }
                msg += " ";
            }
        });
        if (node.HasErrors)  console.log(Array(indent + 1).join("--") + msg);
    }
    else {
        //log name
        console.log(Array(++indent).join("--") + local.__(node.Name) + ":");

        //recursive call for children errors
        for (var i = 0, len = node.Children.length; i < len; i++) {
            if (node.Children[i].HasErrors) displayErrors(node.Children[i], indent);
        }
    }
}



var execFce = function(lang) {

    //set default culture
    local.setLocale(lang);


    //create test data
    var data:VacationApproval.IVacationApprovalData = {};

    //business rules for vacation approval
    var businessRules = new VacationApproval.BusinessRules(data,new FakeVacationDeputyService());

    //fill some fields
    data.Employee = {
        FirstName: "John",
        LastName: "Smith toooooooooooooooooooooooooo long"
    };
    data.Duration = {
        From :moment(new Date()).add({days:-1}).toDate(),
        To : moment(new Date()).add({days:-10}).toDate()
    };

    //execute validation
    var promise = businessRules.Validate();

    return promise.then(function (result) {
        //verify results
        displayErrors(businessRules.Errors, 0);
    }, function (reason) {
        console.log(reason)
    }).then(function () {

        //fill additional fields
        data.Employee.LastName = "Smith";

        data.Deputy1.FirstName = "John";
        data.Deputy1.LastName = "Smith";
        data.Deputy1.Email = "jsmith@gmail.com";

        data.Duration.From = moment(new Date()).add({days: 1}).toDate();
        data.Duration.To = moment(new Date()).add({days: 3}).toDate();

//execute validation
        var promise = businessRules.Validate();

        return promise.then(function (result) {
            //verify results
            displayErrors(businessRules.Errors, 0);
        }, function (reason) {
            console.log(reason)
        })
    });
}

execFce('en').then(function(){return execFce('de')}).then(function(){ return execFce('cz')});






