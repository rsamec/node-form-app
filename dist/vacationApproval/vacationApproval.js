///<reference path='../../../typings/moment/moment.d.ts'/>
///<reference path='../../../typings/underscore/underscore.d.ts'/>
///<reference path='../../../typings/node-form/node-form.d.ts'/>
var VacationApproval;
(function (VacationApproval) {
    /**
    *  It validates passed date against constant from and to interval.
    *  You can check that passed date is greater than now and lower than one year for now.
    */
    var FromToDateValidator = (function () {
        function FromToDateValidator() {
            this.tagName = "dateCompareExt";
        }
        FromToDateValidator.prototype.isAcceptable = function (s) {
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

        FromToDateValidator.prototype.isValid = function (now, then, compareOperator) {
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

        /**
        * It formats error message.
        * @param config localization strings
        * @param args dynamic parameters
        * @returns {string} error message
        */
        FromToDateValidator.prototype.customMessage = function (config, args) {
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
        return FromToDateValidator;
    })();
    VacationApproval.FromToDateValidator = FromToDateValidator;
})(VacationApproval || (VacationApproval = {}));
///<reference path='../../../typings/q/q.d.ts'/>
///<reference path='../../../typings/moment/moment.d.ts'/>
///<reference path='../../../typings/underscore/underscore.d.ts'/>
///<reference path='../../../typings/node-form/node-form.d.ts'/>
///<reference path='FromToDateValidator.ts'/>
///<reference path='Data.ts'/>
var VacationApproval;
(function (VacationApproval) {
    /**
    * Business rules for vacation approval.
    *
    * @class
    * @constructor
    **/
    var BusinessRules = (function () {
        function BusinessRules(Data, vacationDeputyService) {
            this.Data = Data;
            this.vacationDeputyService = vacationDeputyService;
            //assign rule to data context
            this.MainValidator = this.createMainValidator().CreateRule("Data");

            this.EmployeeValidator = this.MainValidator.Children["Employee"];
            this.Deputy1Validator = this.MainValidator.Children["Deputy1"];
            this.Deputy2Validator = this.MainValidator.Children["Deputy2"];
            this.DurationValidator = this.MainValidator.Children["Duration"];
            this.DeputyConflictsValidator = this.MainValidator.Validators["DeputyConflict"];

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
        /**
        * Executes all business rules.
        */
        BusinessRules.prototype.Validate = function () {
            this.MainValidator.ValidateAll(this.Data);
            this.DeputyConflictsValidator.ValidateAsync(this.Data);
        };

        //        public DeputyConflictsValidatorValidateAsync():Q.Promise<Validation.IValidationResult>{
        //            return this.DeputyConflictsValidator.ValidateAsync(this.Data);
        //        }
        BusinessRules.prototype.createMainValidator = function () {
            //create custom validator
            var validator = new Validation.AbstractValidator();

            var personValidator = this.createPersonValidator();
            validator.ValidatorFor("Employee", personValidator);
            validator.ValidatorFor("Deputy1", personValidator);
            validator.ValidatorFor("Deputy2", personValidator);

            var durationValidator = this.createDurationValidator();
            validator.ValidatorFor("Duration", durationValidator);

            var selfService = this.vacationDeputyService;
            var deputyConflictFce = function (args) {
                var deferred = Q.defer();

                selfService.isAcceptable(this).then(function (result) {
                    args.HasError = false;
                    args.ErrorMessage = "";

                    if (!result) {
                        args.HasError = true;
                        args.ErrorMessage = "Deputies conflict. Select another deputy.";
                    }
                    deferred.resolve(undefined);
                });

                return deferred.promise;
            };

            var diffNames = { Name: "DeputyConflict", AsyncValidationFce: deputyConflictFce };

            //shared validation
            validator.ValidationFor("DeputyConflict", diffNames);

            return validator;
        };

        BusinessRules.prototype.createDurationValidator = function () {
            //create custom composite validator
            var validator = new Validation.AbstractValidator();

            //create validators
            var required = new Validation.RequiredValidator();
            var greaterThanToday = new VacationApproval.FromToDateValidator();
            greaterThanToday.FromOperator = 4 /* GreaterThanEqual */;
            greaterThanToday.From = new Date();
            greaterThanToday.ToOperator = 1 /* LessThanEqual */;
            greaterThanToday.To = moment(new Date()).add({ year: 1 }).toDate();
            greaterThanToday.IgnoreTime = true;

            //assign validators to properties
            validator.RuleFor("From", required);
            validator.RuleFor("To", required);

            validator.RuleFor("From", greaterThanToday);
            validator.RuleFor("To", greaterThanToday);

            //create custom message for validation
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

            //create validator function
            var isBeforeFce = function (args) {
                args.HasError = false;
                args.ErrorMessage = "";

                //no dates - > nothing to validate
                if (!_.isDate(this.From) || !_.isDate(this.To))
                    return;
                var to = moment(this.To).clone();
                if (moment(this.From).startOf('day').isAfter(moment(to).add({ days: -1 }).startOf('day'))) {
                    args.HasError = true;
                    args.ErrorMessage = customErrorMessage({ Msg: "Date from '{From}' must be before date to '{To}'.", Format: 'MM/DD/YYYY' }, this);
                    args.TranslateArgs = { TranslateId: 'BeforeDate', MessageArgs: this, CustomMessage: customErrorMessage };
                    return;
                }

                var maxDays = 30;

                //maximal duration
                if (moment(this.To).startOf('day').diff(moment(this.From).startOf('day'), 'days') > maxDays) {
                    args.HasError = true;
                    var messageArgs = { MaxDays: maxDays };
                    args.ErrorMessage = Validation.StringFce.format("Maximal vacation duration is {MaxDays}'.", messageArgs);
                    args.TranslateArgs = { TranslateId: 'MaxDuration', MessageArgs: messageArgs };
                }
            };

            //wrap validator function to named shared validation
            var validatorFce = { Name: "VacationDuration", ValidationFce: isBeforeFce };

            //assigned shared validation to properties
            validator.ValidationFor("From", validatorFce);
            validator.ValidationFor("To", validatorFce);

            return validator;
        };

        BusinessRules.prototype.createPersonValidator = function () {
            //create custom composite validator
            var personValidator = new Validation.AbstractValidator();

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
        };
        return BusinessRules;
    })();
    VacationApproval.BusinessRules = BusinessRules;
})(VacationApproval || (VacationApproval = {}));
var moment = require('moment-range');
var _ = require('underscore');
var Q = require('q');
var Validation = require('node-form');
module.exports = VacationApproval;
