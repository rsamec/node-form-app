node-form-app
=============

This application demonstrates usage of form validation engine [node-form](https://github.com/rsamec/form) in NodeJS.
It uses example of vacation approval.

+   define business rules for vacation approval
+   how to use these business rules
+   how to display errors for different languages
+   test all business rules

## Install

To install and run example

```bash
git clone https://github.com/rsamec/node-form-app
npm install
node index.js
```

All source code is written in typescript.
To compile typescript

```bash
REM to compile example usage
tsc index.ts --t ES5
REM to compile business rules
tsc models/vacationApproval/BusinessRules.ts --t ES5 --out vacationApproval.js
```

To run tests

```bash
mocha test
```

## Business rules for vacation

Vacation request - basic business rules

+   name -> first name + last name is required
+   duration
    +   from and to is required
    +   from and to must be valid dates
    +   from and to must be greater or equal today
    +   from and to must be less or equal 1 year
    +   from must be at least one day before to
    +   minimal duration is 1 day
    +   maximal duration is 30 days
+   deputy
    +   first name + last name of deputy is required
    +   contact (email) is required
    +   can not select deputy have approved vacation at the same days (async) - not implemented yet
+   at least one deputy is required -> second deputy is optional

## Business rules definition

+ define data structure for vacation approval

```typescript
   /**
     * Data structure for vacation approval.
     */
    export interface IVacationApprovalData {
        Employee?:IPerson;
        Deputy1?:IPerson;
        Deputy2?:IPerson;
        Duration?:IDuration;
        Comment?:string;
    }

    /**
     * Data structure for vacation duration.
     */
    export interface IDuration {
        From:Date;
        To:Date;
        Days?:number;
    }

    /**
     * Data structure for person.
     */
    export interface IPerson {
        Checked?:boolean;
        FirstName:string;
        LastName:string;
        Email?:string;
    }
```

+ define common person validator
+ define specialized duration validator
+ use person validator for Employee and Deputies and use duration valiator for Duration property

```typescript

  //create main data validator
  var validator = new Validation.AbstractValidator<IVacationApprovalData>();

  //common person validator
  var personValidator = this.createPersonValidator();

  //assign validator to properties
  validator.ValidatorFor("Employee", personValidator);
  validator.ValidatorFor("Deputy1", personValidator);
  validator.ValidatorFor("Deputy2", personValidator);

  var durationValidator = this.createDurationValidator();
  validator.ValidatorFor("Duration", durationValidator);


    private createPersonValidator():Validation.IAbstractValidator<IPerson> {

             //create custom composite validator
             var personValidator = new Validation.AbstractValidator<IPerson>();

             //create validators
             var required = new Validation.RequiredValidator();
             var email = new Validation.EmailValidator();
             var maxLength = new Validation.MaxLengthValidator();
             maxLength.MaxLength = 15;

             //assign validators to properties
             personValidator.RuleFor("FirstName", required);
             personValidator.RuleFor("FirstName", maxLength);

             personValidator.RuleFor("LastName", required);
             personValidator.RuleFor("LastName", maxLength);

             personValidator.RuleFor("Email", required);
             personValidator.RuleFor("Email", email);

             return personValidator;
         }

    private createDurationValidator():Validation.IAbstractValidator<IDuration> {

            //create custom composite validator
            var validator = new Validation.AbstractValidator<IDuration>();

            //create validators
            var required = new Validation.RequiredValidator();
            var greaterThanToday = new FromToDateValidator();
            greaterThanToday.FromOperator = Validation.CompareOperator.GreaterThanEqual;
            greaterThanToday.From = new Date();
            greaterThanToday.ToOperator = Validation.CompareOperator.LessThanEqual;
            greaterThanToday.To = moment(new Date()).add({year: 1}).toDate();
            greaterThanToday.IgnoreTime = true;

            //assign validators to properties
            validator.RuleFor("From", required);
            validator.RuleFor("To", required);

            validator.RuleFor("From", greaterThanToday);
            validator.RuleFor("To", greaterThanToday);

            //create custom message for validation
            var customErrorMessage = function (config, args) {
                var msg = config["Msg"]

                var format = config["Format"];
                if (format != undefined) {
                    _.extend(args, {
                        FormatedFrom: moment(args.From).format(format),
                        FormatedTo: moment(args.To).format(format),
                        FormatedAttemptedValue: moment(args.AttemptedValue).format(format)
                    });
                }

                msg = msg.replace('From', 'FormatedFrom');
                msg = msg.replace('To', 'FormatedTo');
                msg = msg.replace('AttemptedValue', 'FormatedAttemptedValue');
                return Validation.StringFce.format(msg, args);
            };

            //create validator function
            var isBeforeFce = function (args:any) {
                args.HasError = false;
                args.ErrorMessage = "";

                //no dates - > nothing to validate
                if (!_.isDate(this.From) || !_.isDate(this.To)) return;
                var to = moment(this.To).clone();
                if (moment(this.From).startOf('day').isAfter(moment(to).add({days: -1}).startOf('day'))) {
                    args.HasError = true;
                    args.ErrorMessage = customErrorMessage({Msg:"Date from '{From}' must be before date to '{To}'.",Format:'MM/DD/YYYY'}, this);
                    args.TranslateArgs = {TranslateId: 'BeforeDate', MessageArgs: this, CustomMessage: customErrorMessage};
                    return;
                }

                var maxDays:number = 30
                //maximal duration
                if (moment(this.To).startOf('day').diff(moment(this.From).startOf('day'),'days') > maxDays) {
                    args.HasError = true;
                    var messageArgs = {MaxDays:maxDays};
                    args.ErrorMessage = Validation.StringFce.format("Maximal vacation duration is {MaxDays}'.", messageArgs);
                    args.TranslateArgs = {TranslateId: 'MaxDuration', MessageArgs: messageArgs};

                }
            }

            //wrap validator function to named shared validation
            var validatorFce = {Name: "VacationDuration", ValidationFce: isBeforeFce};

            //assigned shared validation to properties
            validator.ValidationFor("From", validatorFce);
            validator.ValidationFor("To", validatorFce);

            return  validator;
        }
```

## Tests

Example of duration business rules test

```typescript
 describe('duration', function () {

        describe('from and to fields', function () {
            it('fill no dates', function () {
                //when
                data.Duration = {};

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(true);
            });


            it('fill empty dates', function () {
                //when
                //when
                data.Duration = {
                    From: '',
                    To: ''
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(true);
            });

            it('fill dates before today', function () {
                //when
                //when
                data.Duration = {
                    From: moment(new Date()).add({days: -1}).toDate(),
                    To: moment(new Date()).add({days: -1}).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(true);
            });

            it('fill dates qreater than one year from today', function () {
                //when
                //when
                data.Duration = {
                    From: moment(new Date()).add({years: 1, days: 1}).toDate(),
                    To: moment(new Date()).add({years: 1, days: 1}).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(true);
            });

            it('fill dates qreater than one year from today', function () {
                //when
                //when
                data.Duration = {
                    From: moment(new Date()).add({years: 1, days: 1}).toDate(),
                    To: moment(new Date()).add({years: 1, days: 1}).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(true);
            });

            it('fill today', function () {
                //when
                //when
                data.Duration = {
                    From: new Date(),
                    To: new Date()

                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(false);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(false);
            });

            it('fill one year from today', function () {
                //when
                //when
                data.Duration = {
                    From: moment(new Date()).add({years: 1}).toDate(),
                    To: moment(new Date()).add({years: 1}).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(false);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(false);
            });

        });

        describe('duration in days', function () {
            it('zero duration', function () {
                //when
                //when
                data.Duration = {
                    From: new Date(),
                    To: new Date()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["VacationDuration"].HasErrors).to.equal(true);
            });

            it('negative duration', function () {
                //when
                //when
                data.Duration = {
                    From: new Date(),
                    To: moment(new Date()).add({ days: -1 }).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["VacationDuration"].HasErrors).to.equal(true);
            });

            it('minimal duration', function () {
                //when
                //when
                data.Duration = {
                    From: new Date(),
                    To: moment(new Date()).add({ days: 1 }).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["VacationDuration"].HasErrors).to.equal(false);
            });

            it('maximal duration 30 days', function () {
                //when
                //when
                data.Duration = {
                    From: new Date(),
                    To: moment(new Date()).add({ days: 30 }).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["VacationDuration"].HasErrors).to.equal(false);
            });

            it('too big duration 31 days', function () {
                //when
                //when
                data.Duration = {
                    From: new Date(),
                    To: moment(new Date()).add({ days: 31 }).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["VacationDuration"].HasErrors).to.equal(true);
            });
        });
    });
```

Output of all business rules for vacation are under tests.

```bash

 business rules for vacation approval
    employee
      first name + last name
        √ fill no names
        √ fill empty names
        √ fill long names
        √ fill some names
    duration
      from and to fields
        √ fill no dates
        √ fill empty dates
        √ fill dates before today
        √ fill dates qreater than one year from today
        √ fill dates qreater than one year from today
        √ fill today
        √ fill one year from today
      duration in days
        √ zero duration
        √ negative duration
        √ minimal duration
        √ maximal duration 30 days
        √ too big duration 31 days
    deputy
      first name + last name
        √ fill no names
        √ fill empty names
        √ fill long names
        √ fill some names
      email
        √ fill no email
        √ fill wrong email
        √ fill some email
    deputy check with list of all approved vacations that they are not in conflict
      √ fill employee with vacation and confict in days (1006ms)
      √ fill employee with vacation and confict in days (1012ms)
```
## Basic usage

```typescript
import moment = require('moment');
import _ = require('underscore');
import Validation = require('node-form');
var VacationApproval = require('./models/vacationApproval/vacationApproval.js');

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

## Example usage


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
