///<reference path='../../../typings/moment/moment.d.ts'/>
///<reference path='../../../typings/underscore/underscore.d.ts'/>
///<reference path='../../../typings/node-form/node-form.d.ts'/>

///<reference path='FromToDateValidator.ts'/>
///<reference path='Data.ts'/>

module VacationApproval {

    /**
     * Business rules for vacation approval.
     *
     * @class
     * @constructor
     **/
    export class BusinessRules {

        /**
         * Business rules for employee requested the vacation.
         */
        public EmployeeValidator;

        /**
         * Business rules for first deputy for employee having the vacation.
         */
        public Deputy1Validator;

        /**
         * Business rules for second deputy for employee having the vacation.
         */
        public Deputy2Validator;

        /**
         * Business rules for duration of vacation.
         */
        public DurationValidator;


        /**
         *  Deputy conflict - employee that have approved vacation and its someones's deputy at the same days.
         */
        public DeputyConflictsValidator;


        /**
         * All business rules for the vacation approval.
         */
        public MainValidator;


        /**
         * Return the state of all business rules.
         */
        public Errors;


        constructor(public Data:IVacationApprovalData, private vacationDeputyService:IVacationDeputyService) {

            //assign rule to data context
            this.MainValidator = this.createMainValidator().CreateRule("Data");


            this.EmployeeValidator = this.MainValidator.Children["Employee"];
            this.Deputy1Validator = this.MainValidator.Children["Deputy1"];
            this.Deputy2Validator = this.MainValidator.Children["Deputy2"];
            this.DurationValidator = this.MainValidator.Children["Duration"];
            this.DeputyConflictsValidator = this.MainValidator.Validators["DeputyConflict"];

            //enable optional on the upper level
            this.EmployeeValidator.Rules["Email"].Optional = function () {
                return this.Email == undefined || !this.Email.Checked
            }.bind(this.Data.Employee);

//            this.Deputy1Validator.SetOptional(function () {
//                return this.Deputy1 == undefined || !this.Deputy1.Checked
//            }.bind(this.Data));


            this.Deputy2Validator.SetOptional(function () {
                return this.Deputy2 == undefined || !this.Deputy2.Checked
            }.bind(this.Data))


            this.Errors = this.MainValidator.ValidationResult;
        }

        /**
         * Executes all business rules.
         */
        public Validate():void {
            this.MainValidator.ValidateAll(this.Data);
            this.DeputyConflictsValidator.ValidateAsync(this.Data);
        }

//        public DeputyConflictsValidatorValidateAsync():Q.Promise<Validation.IValidationResult>{
//            return this.DeputyConflictsValidator.ValidateAsync(this.Data);
//        }

        private createMainValidator():Validation.IAbstractValidator<IVacationApprovalData> {

            //create custom validator
            var validator = new Validation.AbstractValidator<IVacationApprovalData>();

            var personValidator = this.createPersonValidator();
            validator.ValidatorFor("Employee", personValidator);
            validator.ValidatorFor("Deputy1", personValidator);
            validator.ValidatorFor("Deputy2", personValidator);


            var durationValidator = this.createDurationValidator();
            validator.ValidatorFor("Duration", durationValidator);


            //separate custom shared validator
//            var diffNamesFce = function (args:Validation.IError) {
//                args.HasError = false;
//                args.ErrorMessage = "";
//                if (!this.Deputy2.Checked) return;
//                if (this.Deputy1.FirstName == this.Deputy2.FirstName && this.Deputy1.LastName == this.Deputy2.LastName) {
//                    args.HasError = true;
//                    args.ErrorMessage = "Deputies can not have the same names.";
//                    return;
//                }
//            }
            var selfService = this.vacationDeputyService;
            var deputyConflictFce = function(args:Validation.IError){
                var deferred = Q.defer();

                selfService.isAcceptable(this).then(
                    function(result){
                        args.HasError = false;
                        args.ErrorMessage = "";

                        if (!result){
                            args.HasError = true;
                            args.ErrorMessage = "Deputies conflict. Select another deputy.";
                        }
                        deferred.resolve(undefined);
                    });


                 return deferred.promise;
            }

            var diffNames = {Name: "DeputyConflict", AsyncValidationFce: deputyConflictFce};

            //shared validation
            validator.ValidationFor("DeputyConflict", diffNames);


            return validator;
        }

        private createDurationValidator():Validation.IAbstractValidator<IDuration> {

            //create custom composite validator
            var validator = new Validation.AbstractValidator<IDuration>();

            var required = new Validation.RequiredValidator();

            var greaterThanToday = new FromToDateValidator();
            greaterThanToday.FromOperator = Validation.CompareOperator.GreaterThanEqual;
            greaterThanToday.From = new Date();
            greaterThanToday.IgnoreTime = true;
            greaterThanToday.ToOperator = Validation.CompareOperator.LessThanEqual;
            greaterThanToday.To = moment(new Date()).add({year: 1}).toDate();

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


            validator.RuleFor("From", required);
            validator.RuleFor("To", required);

            validator.RuleFor("From", greaterThanToday);
            validator.RuleFor("To", greaterThanToday);

            //


            //create named shared validaton
            var isBeforeFce = function (args:any) {
                args.HasError = false;
                args.ErrorMessage = "";

                //no dates - > nothing to validate
                if (!_.isDate(this.From) || !_.isDate(this.To)) return;
                var to = moment(this.To).clone();
                if (moment(this.From).startOf('day').isAfter(moment(to).add({days: -1}).startOf('day'))) {
                    args.HasError = true;
                    args.ErrorMessage = Validation.StringFce.format("Date from '{From}' must be before date to '{To}'.", this);
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
            var validatorFce = {Name: "VacationDuration", ValidationFce: isBeforeFce};

            //assign shared validation to fields
            validator.ValidationFor("From", validatorFce);
            validator.ValidationFor("To", validatorFce);


            return  validator;

        }

        private createPersonValidator():Validation.IAbstractValidator<IPerson> {

            //create custom composite validator
            var personValidator = new Validation.AbstractValidator<IPerson>();

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
        }

    }
}

//var moment = require('moment-range');
//var _ = require('underscore');
//var Q = require('q');
//var Validation = require('node-form');
//module.exports = VacationApproval;
