node-form-app
=============

This application demonstrates usage of form validation engine [node-form](https://github.com/rsamec/form) in NodeJS.
It uses example of vacation approval.

+   how to use business rules for vacation approval
+   how to display errors for different languages

More complex usages of form validation engine [node-form tutorial](https://github.com/rsamec/form/wiki).

## Install

To install and run example

```bash
git clone https://github.com/rsamec/node-form-app
npm install
node index
```

All source code is written in typescript.
To compile typescript

```bash
REM to compile example usage
tsd update
tsc index.ts --t ES5 -m commonjs
```

## Basic usage

```typescript
import Validation = require('node-form');
import VacationApproval = require('br-vacation-approval');

//create test data
var data:VacationApproval.IVacationApprovalData = {
                Employee: {
                    FirstName: 'John',
                    LastName: 'Smith toooooooooooooooooooooooooo long'
                },
                Deputy1: {
                    Checked:true,
                    FirstName: 'Paul',
                    LastName: 'Neuman',
                    Email: 'pneuman@gmai.com'
                },
                Duration: {
                    From: new Date(),
                    To: moment(new Date()).add('days', 1).toDate()
                }
            };


//business rules for vacation approval
var businessRules = new VacationApproval.BusinessRules(data);

//execute validation
businessRules.Validate();

//verify and display results
if (businessRules.Errors.HasErrors) console.log(businessRules.Errors.ErrorMessage);
```

Output
```bash
Please enter no more than 15 characters.
```

## Example usage with localization support.

These example displays pretty error messages in english or czech localization.

```typescript
///<reference path='typings/node-form/node-form.d.ts'/>
///<reference path='typings/node/node.d.ts'/>
///<reference path='typings/i18n-2/i18n-2.d.ts'/>
///<reference path='typings/underscore/underscore.d.ts'/>
///<reference path='typings/moment/moment.d.ts'/>

///<reference path='models/vacationApproval/vacationApproval.d.ts'/>

import _ = require('underscore');
import i18n = require('i18n-2');
import Validation = require('node-form');
var VacationApproval = require('./models/vacationApproval/vacationApproval.js');

var local  = new i18n({locales:['en','cz'],extension:'.json'});
local.setLocale('en');

//create test data
var data:VacationApproval.IVacationApprovalData = {};


//business rules for vacation approval
var businessRules = new VacationApproval.BusinessRules(data,undefined);


//execute validation
businessRules.Validate();

//verify results
if (businessRules.Errors.HasErrors) displayErrors(businessRules.Errors,0)

//fill some fields
data.Employee.FirstName = "John";
data.Employee.LastName = "Smith toooooooooooooooooooooooooo long";

data.Duration.From = moment(new Date()).add({days:-1}).toDate();
data.Duration.To = moment(new Date()).add({days:-10}).toDate();

//execute validation
businessRules.Validate();

//verify results
if (businessRules.Errors.HasErrors) displayErrors(businessRules.Errors,0);


//fill all fields
data.Employee.LastName = "Smith";


data.Deputy1.FirstName = "John";
data.Deputy1.LastName = "Smith";
data.Deputy1.Email = "jsmith@gmail.com";

data.Duration.From = moment(new Date()).add({days:1}).toDate();
data.Duration.To = moment(new Date()).add({days:4}).toDate();

//execute validation
businessRules.Validate();

//verify results
displayErrors(businessRules.Errors,0);
```

#### Output - local.setLocale('en');
```bash
--------------------------------------------------------------------------------------------------
-- Errors
--------------------------------------------------------------------------------------------------
Data:
--Employee:
----First name:This field is required.
----Last name:This field is required.
--Deputy:
----First name:This field is required.
----Last name:This field is required.
----Email:This field is required.
--Duration:
----From:This field is required.
----To:This field is required.
--------------------------------------------------------------------------------------------------
-- Errors
--------------------------------------------------------------------------------------------------
Data:
--Employee:
----Last name:Please enter no more than 15 characters.
--Deputy:
----First name:This field is required.
----Last name:This field is required.
----Email:This field is required.
--Duration:
----From:Date must be between ('07/27/2014' - '07/27/2015').
----To:Date must be between ('07/27/2014' - '07/27/2015').
----Vacation duration:Date '07/26/2014' must be before '07/17/2014'.
--------------------------------------------------------------------------------------------------
-- Errors
--------------------------------------------------------------------------------------------------
There are no errors.
```

#### Output - local.setLocale('cz');

```bash
--------------------------------------------------------------------------------------------------
-- Errors
--------------------------------------------------------------------------------------------------
Data:
--Zaměstnanec:
----Jméno:Toto pole je povinné
----Příjmení:Toto pole je povinné
--Zástupce:
----Jméno:Toto pole je povinné
----Příjmení:Toto pole je povinné
----Email:Toto pole je povinné
--Doba:
----Od:Toto pole je povinné
----Do:Toto pole je povinné
--------------------------------------------------------------------------------------------------
-- Errors
--------------------------------------------------------------------------------------------------
Data:
--Zaměstnanec:
----Příjmení:Prosím, zadejte nejvíce 15 znaků.
--Zástupce:
----Jméno:Toto pole je povinné
----Příjmení:Toto pole je povinné
----Email:Toto pole je povinné
--Doba:
----Od:Datum musí být mezi ('27.07.2014' - '27.07.2015').
----Do:Datum musí být mezi ('27.07.2014' - '27.07.2015').
----Doba dovolené:Datum '26.07.2014' musí být před datem '17.07.2014'.
--------------------------------------------------------------------------------------------------
-- Errors
--------------------------------------------------------------------------------------------------
Neexistují žádné chyby.

```

These is an example of function how to format pretty errors output.

```typescript
var displayErrors = function(node, indent) {

    if (indent == 0){
        console.log(Array(50).join("--"))
        console.log("-- Errors");
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

                //custom messages
                if (failure["CustomMessage"] == undefined) {
                    //call standard translation
                    msg += failure == undefined ? failure.TranslateId : Validation.StringFce.format(local.__(failure.TranslateId), failure.MessageArgs);
                }
                else {
                    //call custom messages function - pass translation config and message args
                    msg += failure == undefined ? failure.TranslateId : failure["CustomMessage"](local.__(failure.TranslateId), failure.MessageArgs);
                }
                console.log(Array(indent + 1).join("--") + msg);
            }
        });
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
```
