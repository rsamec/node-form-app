node-form-app
=============

This application demonstrates usage of form validation engine [business-rules-engine](https://github.com/rsamec/business-rules-engine) in NodeJS.
It uses example of vacation approval.

+   how to use business rules for vacation approval
+   how to display errors for different languages

More complex usages of form validation engine [business-rules-engine tutorial](https://github.com/rsamec/business-rules-engine/wiki).

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
import Validation = require('business-rules-engine');
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

These example displays pretty error messages in english, german and czech localization.

```typescript

import i18n = require('i18n-2');
var en = require('business-rules-engine/commonjs/i18n/messages_en.js');
var cz = require('business-rules-engine/commonjs/i18n/messages_cs.js');
var de = require('business-rules-engine/commonjs/i18n/messages_de.js');

//localization support
var local  = new i18n({
    locales:['en','cz','de'],
    directory: 'node_modules/br-vacation-approval/i18n',
    extension:'.json'});

_.extend(local.locales['en'],en.ValidationMessages);
_.extend(local.locales['cz'],cz.ValidationMessages);
_.extend(local.locales['de'],de.ValidationMessages);

```

#### Output for locales:['en','cz','de'],
```bash
--------------------------------------------------------------------------------------------------
-- Errors
--------------------------------------------------------------------------------------------------
Vacation:
--Employee:
----Last name:Please enter no more than 15 characters.
--Deputy:
----First name:This field is required.
----Last name:This field is required.
----Email:This field is required.
--Approval:
----ApprovedBy:
------First name:This field is required.
------Last name:This field is required.
------Email:This field is required.
--Duration:
----From:Date must be between ('08/20/2014' - '08/20/2015').
----To:Please select weekdays, weekends are not permitted. Date must be between ('08/20/2014' - '08/20/2015').
----Vacation duration:Date '08/19/2014' must be before '08/10/2014'.
--------------------------------------------------------------------------------------------------
-- Errors
--------------------------------------------------------------------------------------------------
Vacation:
--Approval:
----ApprovedBy:
------First name:This field is required.
------Last name:This field is required.
------Email:This field is required.
--Duration:
----To:Please select weekdays, weekends are not permitted.
--------------------------------------------------------------------------------------------------
-- Fehlers
--------------------------------------------------------------------------------------------------
Urlaub:
--Arbeitnehmer:
----Nachname:Geben Sie bitte maximal 15 Zeichen ein.
--Vertreter:
----Vorname:Dieses Feld ist ein Pflichtfeld.
----Nachname:Dieses Feld ist ein Pflichtfeld.
----Email:Dieses Feld ist ein Pflichtfeld.
--Bestaetig:
----Bestaetig von:
------Vorname:Dieses Feld ist ein Pflichtfeld.
------Nachname:Dieses Feld ist ein Pflichtfeld.
------Email:Dieses Feld ist ein Pflichtfeld.
--Dauer:
----Von:Geben Sie bitte eines Datum zwischen ('20.08.2014' - '20.08.2015').
----Bis:Geben Sie bitte eines Datum anders von Samstag or Sonntag. Geben Sie bitte eines Datum zwischen ('20.08.2014' - '20.08.2015').
----Urlaubdauer:Das datum '19.08.2014' must vor dem datum '10.08.2014' sein.
--------------------------------------------------------------------------------------------------
-- Fehlers
--------------------------------------------------------------------------------------------------
Urlaub:
--Bestaetig:
----Bestaetig von:
------Vorname:Dieses Feld ist ein Pflichtfeld.
------Nachname:Dieses Feld ist ein Pflichtfeld.
------Email:Dieses Feld ist ein Pflichtfeld.
--Dauer:
----Bis:Geben Sie bitte eines Datum anders von Samstag or Sonntag.
--------------------------------------------------------------------------------------------------
-- Chyby
--------------------------------------------------------------------------------------------------
Dovolená:
--Zaměstnanec:
----Příjmení:Prosím, zadejte nejvíce 15 znaků.
--Zástupce:
----Jméno:Tento údaj je povinný.
----Příjmení:Tento údaj je povinný.
----Email:Tento údaj je povinný.
--Schválení:
----Schváleno kým:
------Jméno:Tento údaj je povinný.
------Příjmení:Tento údaj je povinný.
------Email:Tento údaj je povinný.
--Doba:
----Od:Datum musí být mezi ('20.08.2014' - '20.08.2015').
----Do:Datum nesmí být sobota nebo neděle. Datum musí být mezi ('20.08.2014' - '20.08.2015').
----Doba dovolené:Datum '19.08.2014' musí být před datem '10.08.2014'.
--------------------------------------------------------------------------------------------------
-- Chyby
--------------------------------------------------------------------------------------------------
Dovolená:
--Schválení:
----Schváleno kým:
------Jméno:Tento údaj je povinný.
------Příjmení:Tento údaj je povinný.
------Email:Tento údaj je povinný.
--Doba:
----Do:Datum nesmí být sobota nebo neděle.

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
