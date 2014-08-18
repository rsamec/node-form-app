///<reference path='typings/node-form/node-form.d.ts'/>
///<reference path='typings/node/node.d.ts'/>
///<reference path='typings/i18n-2/i18n-2.d.ts'/>
///<reference path='typings/underscore/underscore.d.ts'/>
///<reference path='typings/moment/moment.d.ts'/>
///<reference path='dist/vacationApproval/vacationApproval.d.ts'/>
var moment = require('moment');
var _ = require('underscore');
var i18n = require('i18n-2');

var Validators = require('node-form/commonjs/BasicValidators');
var Utils = require('node-form/commonjs/Utils');
var VacationApproval = require('./dist/vacationApproval/node-vacationApproval.js');
var FakeVacationDeputyService = require('./test/models/vacationApproval/FakeVacationDeputyService.js');
var en = require('node-form/i18n/messages_en.js');
var cz = require('node-form/i18n/messages_cs.js');
var de = require('node-form/i18n/messages_de.js');

//prepeare localization
var local = new i18n({
    locales: ['en', 'cz', 'de'],
    directory: 'src/models/vacationApproval/locales',
    extension: '.json' });

_.extend(local.locales['en'], en.ValidationMessages);
_.extend(local.locales['cz'], cz.ValidationMessages);
_.extend(local.locales['de'], de.ValidationMessages);

//friendly-displayed errors
var displayErrors = function (node, indent) {
    if (indent == 0) {
        console.log(Array(50).join("--"));
        console.log("-- " + local.__("Errors"));
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
                if (failure == undefined) {
                    msg += childError.ErrorMessage;
                } else {
                    //custom messages
                    if (failure["CustomMessage"] == undefined) {
                        //call standard translation
                        msg += failure == undefined ? failure.TranslateId : Utils.StringFce.format(local.__(failure.TranslateId), failure.MessageArgs);
                    } else {
                        //call custom messages function - pass translation config and message args
                        msg += failure == undefined ? failure.TranslateId : failure["CustomMessage"](local.__(failure.TranslateId), failure.MessageArgs);
                    }
                }
                msg += " ";
            }
        });
        if (node.HasErrors)
            console.log(Array(indent + 1).join("--") + msg);
    } else {
        //log name
        console.log(Array(++indent).join("--") + local.__(node.Name) + ":");

        for (var i = 0, len = node.Children.length; i < len; i++) {
            if (node.Children[i].HasErrors)
                displayErrors(node.Children[i], indent);
        }
    }
};

//set default culture
local.setLocale('cz');

//create test data
var data = {};

//business rules for vacation approval
var businessRules = new VacationApproval.BusinessRules(data, new FakeVacationDeputyService());

//fill some fields
data.Employee = {
    FirstName: "John",
    LastName: "Smith toooooooooooooooooooooooooo long"
};
data.Duration = {
    From: moment(new Date()).add({ days: -1 }).toDate(),
    To: moment(new Date()).add({ days: -10 }).toDate()
};

//execute validation
var promise = businessRules.Validate();

promise.then(function (result) {
    //verify results
    displayErrors(businessRules.Errors, 0);
}, function (reason) {
    console.log(reason);
}).then(function () {
    //fill additional fields
    data.Employee.LastName = "Smith";

    data.Deputy1.FirstName = "John";
    data.Deputy1.LastName = "Smith";
    data.Deputy1.Email = "jsmith@gmail.com";

    data.Duration.From = moment(new Date()).add({ days: 1 }).toDate();
    data.Duration.To = moment(new Date()).add({ days: 3 }).toDate();

    //execute validation
    var promise = businessRules.Validate();

    promise.then(function (result) {
        //verify results
        displayErrors(businessRules.Errors, 0);
    }, function (reason) {
        console.log(reason);
    });
});
//# sourceMappingURL=index.js.map
