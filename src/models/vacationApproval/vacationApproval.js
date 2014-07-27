///<reference path='../../typings/moment/moment.d.ts'/>
///<reference path='../../typings/underscore/underscore.d.ts'/>
///<reference path='../../typings/node-form/node-form.d.ts'/>
var VacationApproval;
(function (VacationApproval) {
    var MyCustomValidator = (function () {
        function MyCustomValidator() {
            this.tagName = "dateCompareExt";
        }
        MyCustomValidator.prototype.isAcceptable = function (s) {
            //if date to compare is not specified - defaults to compare against now
            if (!_.isDate(s))
                return false;

            var then = moment(s);

            if (this.From == undefined)
                this.From = new Date();
            var now = moment(this.From);

            if (this.To == undefined)
                this.To = new Date();
            var now2 = moment(this.To);
            var isValid = this.isValid(now, then, this.FromOperator) && this.isValid(now2, then, this.ToOperator);

            return isValid;
        };

        MyCustomValidator.prototype.isValid = function (now, then, compareOperator) {
            var isValid = false;
            if (this.IgnoreTime) {
                then = then.startOf('day');
                now = now.startOf('day');
            }
            var diffs = then.diff(now);
            if (this.IgnoreTime)
                diffs = moment.duration(diffs).days();

            if (diffs < 0) {
                isValid = compareOperator == 0 /* LessThan */ || compareOperator == 1 /* LessThanEqual */ || compareOperator == 3 /* NotEqual */;
            } else if (diffs > 0) {
                isValid = compareOperator == 5 /* GreaterThan */ || compareOperator == 4 /* GreaterThanEqual */ || compareOperator == 3 /* NotEqual */;
            } else {
                isValid = compareOperator == 1 /* LessThanEqual */ || compareOperator == 2 /* Equal */ || compareOperator == 4 /* GreaterThanEqual */;
            }
            return isValid;
        };

        MyCustomValidator.prototype.customMessage = function (config, args) {
            var msg = config["Msg"];

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
        return MyCustomValidator;
    })();
    VacationApproval.MyCustomValidator = MyCustomValidator;
})(VacationApproval || (VacationApproval = {}));
///<reference path='../../typings/moment/moment.d.ts'/>
///<reference path='../../typings/underscore/underscore.d.ts'/>
///<reference path='../../typings/node-form/node-form.d.ts'/>
///<reference path='MyCustomValidator.ts'/>
///<reference path='Data.ts'/>
var VacationApproval;
(function (VacationApproval) {
    /**
    * YUIDoc_comment
    *
    * @class Person
    * @constructor
    **/
    var BusinessRules = (function () {
        function BusinessRules(Data, paramService) {
            this.Data = Data;
            this.paramService = paramService;
            this.CLASS_NAME = 'Person';
            //assign rule to data context
            this.MainValidator = this.createMainValidator().CreateRule("Data");

            this.EmployeeValidator = this.MainValidator.Children["Employee"];
            this.Deputy1Validator = this.MainValidator.Children["Deputy1"];
            this.Deputy2Validator = this.MainValidator.Children["Deputy2"];
            this.DurationValidator = this.MainValidator.Children["Duration"];
            this.DeputyDiffNamesValidator = this.MainValidator.Validators["DiffNames"];

            //enable optional on the upper level
            this.EmployeeValidator.Rules["Email"].Optional = function () {
                return this.Email == undefined || !this.Email.Checked;
            }.bind(this.Data.Employee);

            //            this.Deputy1Validator.SetOptional(function () {
            //                return this.Deputy1 == undefined || !this.Deputy1.Checked
            //            }.bind(this.Data));
            this.Deputy2Validator.SetOptional(function () {
                return this.Deputy2 == undefined || !this.Deputy2.Checked;
            }.bind(this.Data));

            this.Errors = this.MainValidator.ValidationResult;
        }
        BusinessRules.prototype.Validate = function () {
            this.MainValidator.ValidateAll(this.Data);
        };

        BusinessRules.prototype.createMainValidator = function () {
            //create custom validator
            var validator = new Validation.AbstractValidator();

            var personValidator = this.createPersonValidator();
            validator.ValidatorFor("Employee", personValidator);
            validator.ValidatorFor("Deputy1", personValidator);
            validator.ValidatorFor("Deputy2", personValidator);

            var durationValidator = this.createDurationValidator();
            validator.ValidatorFor("Duration", durationValidator);

            //separate custom shared validator
            var diffNamesFce = function (args) {
                args.HasError = false;
                args.ErrorMessage = "";
                if (!this.Deputy2.Checked)
                    return;
                if (this.Deputy1.FirstName == this.Deputy2.FirstName && this.Deputy1.LastName == this.Deputy2.LastName) {
                    args.HasError = true;
                    args.ErrorMessage = "Deputies can not have the same names.";
                    return;
                }
            };

            var diffNames = { Name: "DiffNames", ValidationFce: diffNamesFce };

            //shared validation
            validator.ValidationFor("DeputyShared", diffNames);

            return validator;
        };

        BusinessRules.prototype.createDurationValidator = function () {
            //create custom composite validator
            var validator = new Validation.AbstractValidator();

            var required = new Validation.RequiredValidator();

            var greaterThanToday = new VacationApproval.MyCustomValidator();
            greaterThanToday.FromOperator = 4 /* GreaterThanEqual */;
            greaterThanToday.From = new Date();
            greaterThanToday.IgnoreTime = true;
            greaterThanToday.ToOperator = 1 /* LessThanEqual */;
            greaterThanToday.To = moment(new Date()).add({ year: 1 }).toDate();

            var customErrorMessage = function (config, args) {
                var msg = config["Msg"];

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

            validator.RuleFor("From", required);
            validator.RuleFor("To", required);

            validator.RuleFor("From", greaterThanToday);
            validator.RuleFor("To", greaterThanToday);

            //
            //create named shared validaton
            var isBeforeFce = function (args) {
                args.HasError = false;
                args.ErrorMessage = "";

                //no dates - > nothing to validate
                if (!_.isDate(this.From) || !_.isDate(this.To))
                    return;
                var to = moment(this.To).clone();
                if (moment(this.From).startOf('day').isAfter(moment(to).add({ days: -1 }).startOf('day'))) {
                    args.HasError = true;
                    args.ErrorMessage = Validation.StringFce.format("Date from '{From}' must be before date to '{To}'.", this);
                    args.TranslateArgs = { TranslateId: 'BeforeDate', MessageArgs: this, CustomMessage: customErrorMessage };
                    return;
                }
            };
            var validatorFce = { Name: "VacationDuration", ValidationFce: isBeforeFce };

            //assign shared validation to fields
            validator.ValidationFor("From", validatorFce);
            validator.ValidationFor("To", validatorFce);

            return validator;
        };

        BusinessRules.prototype.createPersonValidator = function () {
            //create custom composite validator
            var personValidator = new Validation.AbstractValidator();

            //create field validators
            var required = new Validation.RequiredValidator();
            var email = new Validation.EmailValidator();
            var maxLength = new Validation.MaxLengthValidator();
            maxLength.MaxLength = 15;

            personValidator.RuleFor("FirstName", required);
            personValidator.RuleFor("FirstName", maxLength);

            personValidator.RuleFor("LastName", required);
            personValidator.RuleFor("LastName", maxLength);

            personValidator.RuleFor("Email", required);
            personValidator.RuleFor("Email", email);

            return personValidator;
        };
        return BusinessRules;
    })();
    VacationApproval.BusinessRules = BusinessRules;
})(VacationApproval || (VacationApproval = {}));
var moment = require('moment');
var _ = require('underscore');
var Validation = require('node-form');

module.exports = VacationApproval;
