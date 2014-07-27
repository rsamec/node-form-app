node-form-app
=============

Demo for form validation engine using NodeJS. This demo demostrates

+   define business rules for vacation request
+   how to use these business rules
+   how to display errors for different languages

## Business rules for vacation

Vacation request - basic business rules

+   name -> first name + last name is required
+   duration
    +   from and to is required
    +   from and to must be valid dates (expect weekends)
    +   from and to must be greater or queal today
    +   from and to must be less or queal 1 year
    +   from must be at least one day before to
+   deputy
    +   first name + last name of deputy is required
    +   contact (email) is required
    +   can not select deputy have approved vacation at the same days (async) - not implemented yet
+   at least one deputy is required -> second deputy is optional


## Install

Download repository or run
```bash
git clone https://github.com/rsamec/node-form-app
```

To run example

```bash
npm install
node index.js
```

## Typescript source compilation

To compile index

```bash
tsc index.ts --t ES5
```

To compile business rules

```bash
tsc models/vacationApproval/BusinessRules.ts --t ES5 --out vacationApproval.js
```

To transform form module pattern to CommonJS module -> add or uncomment these  rows

```javascript
var moment = require('moment');
var _ = require('underscore');
var Validation = require('node-form');

module.exports = VacationApproval;
```javascript


## Examle usage


```typescript
///<reference path='typings/node-form/node-form.d.ts'/>
///<reference path='typings/node/node.d.ts'/>
///<reference path='typings/i18n-2/i18n-2.d.ts'/>
///<reference path='typings/underscore/underscore.d.ts'/>
///<reference path='typings/moment/moment.d.ts'/>

///<reference path='models/vacationApproval/vacationApproval.d.ts'/>

import moment = require('moment');
import _ = require('underscore');
import i18n = require('i18n-2');
import Validation = require('node-form');
var VacationApproval = require('./models/vacationApproval/vacationApproval.js');

var local  = new i18n({locales:['en','cz'],extension:'.json'});

local.setLocale('en');
//

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

#### These is an example of function how to format errors output.

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
