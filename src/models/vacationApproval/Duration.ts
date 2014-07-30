///<reference path='../../../typings/moment/moment.d.ts'/>
///<reference path='../../../typings/underscore/underscore.d.ts'/>
///<reference path='../../../typings/node-form/node-form.d.ts'/>

///<reference path='FromToDateValidator.ts'/>
///<reference path='IsWeekdayValidator.ts'/>
///<reference path='Data.ts'/>

module VacationApproval{
    export class Duration{

        public get Data():VacationApproval.IDuration {return this.DataProvider.Duration;}

        constructor(public DataProvider:IVacationApprovalData){

            _.mixin({

                //returns true if source has all the properties(nested) of target.
                contains: function(obj, target) {
                    if (obj == null) return false;
                    if (obj.length !== +obj.length) obj = _.values(obj);

                    if (_.every(obj,function(item) {return moment.isMoment(item);}))
                    {
                        return _.any(obj,function(item:Moment) {return item.isSame(target);})

                    }else{

                        return _.indexOf(obj, target) >= 0;
                    }
                }

            });
        }

        public get FromDatePart():Moment {return moment(this.Data.From).startOf('days'); }
        public get ToDatePart():Moment {return moment(this.Data.To).startOf('days'); }
        public get ExcludedDaysDatePart():Array<Moment> {return _.map(this.Data.ExcludedDays, function(item) {return moment(item).startOf('days');});}

        private get FromRange():any { return moment().range(this.FromDatePart,this.ToDatePart);}

        public get IsOverLimitRange():boolean {return this.MaxDiffs > this.MAX_DAYS_DIFF;}
        private get MaxDiffs():any {return this.ToDatePart.diff(this.FromDatePart,'days');}
        private MAX_DAYS_DIFF:number = 35

        public get RangeDaysCount():number {return this.RangeDays.length;}
        public get RangeDays():Array<Moment> {
            var days = [];

            //limit maximal range - performance reason
            if (this.IsOverLimitRange) return days;

            this.FromRange.by('days',function(day){
                days.push(day);
            });
            return days;
        }
        public get ExcludedWeekdaysCount():number {return this.ExcludedWeekdays.length;}
        public get ExcludedWeekdays():Array<Moment> {
            var weekends = [];

            //limit maximal range - performance reason
            if (this.IsOverLimitRange) return weekends;
            this.FromRange.by('days',function(day){
                if (day.isoWeekday() == 6 || day.isoWeekday() == 7)
                    weekends.push(day);
            });
            return weekends;
        }
        public get ExcludedDaysCount():number {return this.ExcludedDays.length;}
        public get ExcludedDays():Array<Moment> {
            if (this.Data.ExcludedDays == undefined || this.Data.ExcludedDays.length == 0) return this.ExcludedWeekdays;
            return _.union(this.ExcludedWeekdays, this.ExcludedDaysDatePart);
        }

        /**
         * Return the number of days of vacation.
         */
        public get VacationDaysCount():number {
            if (this.IsOverLimitRange) return this.MaxDiffs;
            return this.VacationDays.length;
        }

        public get VacationDays():Array<Moment> {
            return _.difference(this.RangeDays,this.ExcludedDays);
        }


        public createDurationValidator():Validation.IAbstractValidator<IDuration> {

            //create custom composite validator
            var validator = new Validation.AbstractValidator<IDuration>();

            //create validators
            var required = new Validation.RequiredValidator();
            var greaterThanToday = new FromToDateValidator();
            var weekDay = new IsWeekdayValidator();

            greaterThanToday.FromOperator = Validation.CompareOperator.GreaterThanEqual;
            greaterThanToday.From = new Date();
            greaterThanToday.ToOperator = Validation.CompareOperator.LessThanEqual;
            greaterThanToday.To = moment(new Date()).add({year: 1}).toDate();
            greaterThanToday.IgnoreTime = true;

            //assign validators to properties
            validator.RuleFor("From", required);
            validator.RuleFor("To", required);

            validator.RuleFor("From", weekDay);
            validator.RuleFor("To", weekDay);

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

            var self = this;

            //create validator function
            var vacationDurationFce = function (args:any) {
                args.HasError = false;
                args.ErrorMessage = "";

                //no dates - > nothing to validate
                if (!_.isDate(this.From) || !_.isDate(this.To)) return;

                if (self.FromDatePart.isAfter(self.ToDatePart)) {
                    args.HasError = true;
                    args.ErrorMessage = customErrorMessage({Msg:"Date from '{From}' must be before date to '{To}'.",Format:'MM/DD/YYYY'}, this);
                    args.TranslateArgs = {TranslateId: 'BeforeDate', MessageArgs: this, CustomMessage: customErrorMessage};
                    return;
                }

                var maxDays:number = 25
                //maximal duration
                if (self.IsOverLimitRange || self.VacationDaysCount > maxDays) {
                    args.HasError = true;
                    var messageArgs = {MaxDays:maxDays};
                    args.ErrorMessage = Validation.StringFce.format("Maximal vacation duration is {MaxDays} days.", messageArgs);
                    args.TranslateArgs = {TranslateId: 'MaxDuration', MessageArgs: messageArgs};

                }


                var diff = _.difference(self.ExcludedDaysDatePart,self.RangeDays)
                if (diff.length != 0){
                    args.HasError = true;
                    var messageArgs2 = {ExcludedDates:_.reduce(diff,function(memo,item:Moment){return memo + item.format("MM/DD/YYYY");})};
                    args.ErrorMessage = Validation.StringFce.format("Excluded days are not in range. '{ExcludedDates}'.", messageArgs2);
                    args.TranslateArgs = {TranslateId: 'ExcludedDays', MessageArgs: messageArgs2};
                }

            }

            //wrap validator function to named shared validation
            var validatorFce = {Name: "VacationDuration", ValidationFce: vacationDurationFce};

            //assigned shared validation to properties
            validator.ValidationFor("From", validatorFce);
            validator.ValidationFor("To", validatorFce);

            return  validator;
        }
    }
}