///<reference path='../../../typings/moment/moment.d.ts'/>
///<reference path='../../../typings/underscore/underscore.d.ts'/>
///<reference path='../../../typings/node-form/node-form.d.ts'/>

///<reference path='FromToDateValidator.ts'/>
///<reference path='Data.ts'/>
///<reference path='Duration.ts'/>

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


        public Duration:Duration;

        constructor(public Data:IVacationApprovalData, private vacationDeputyService:IVacationDeputyService) {

            this.Duration = new Duration(this.Data);

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

        /**
         * Execute deputy conflicts validation.
         */
        public DeputyConflictsValidatorValidateAsync():Q.Promise<Validation.IValidationResult>{
            return this.DeputyConflictsValidator.ValidateAsync(this.Data);
        }

        private createMainValidator():Validation.IAbstractValidator<IVacationApprovalData> {

            //create custom validator
            var validator = new Validation.AbstractValidator<IVacationApprovalData>();

            var personValidator = this.createPersonValidator();
            validator.ValidatorFor("Employee", personValidator);
            validator.ValidatorFor("Deputy1", personValidator);
            validator.ValidatorFor("Deputy2", personValidator);


            var durationValidator = this.Duration.createDurationValidator();
            validator.ValidatorFor("Duration", durationValidator);

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

    }
}

//var moment = require('moment-range');
//var _ = require('underscore');
//var Q = require('q');
//var Validation = require('node-form');
//module.exports = VacationApproval;
