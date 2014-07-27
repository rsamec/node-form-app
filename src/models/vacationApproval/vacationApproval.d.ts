/// <reference path="../../../typings/moment/moment.d.ts" />
/// <reference path="../../../typings/underscore/underscore.d.ts" />
/// <reference path="../../../typings/node-form/node-form.d.ts" />
declare module VacationApproval {
    class MyCustomValidator {
        public isAcceptable(s: any): boolean;
        private isValid(now, then, compareOperator);
        public customMessage(config: any, args: any): string;
        public tagName: string;
        public IgnoreTime: boolean;
        /**
        * Set the time of compare between passed date and From date.
        */
        public FromOperator: Validation.CompareOperator;
        /**
        * Set the time of compare between passed date and From date.
        */
        public ToOperator: Validation.CompareOperator;
        /**
        * The datetime against the compare is done.
        * If From is not set, then comparison is done against actual datetime.
        */
        public From: Date;
        /**
        * The datetime against the compare is done.
        * If From is not set, then comparison is done against actual datetime.
        */
        public To: Date;
    }
}
declare module VacationApproval {
    interface IVacationApprovalData {
        Employee?: IPerson;
        Deputy1?: IPerson;
        Deputy2?: IPerson;
        Duration?: IDuration;
        Comment?: string;
    }
    interface IDuration {
        From: Date;
        To: Date;
        Days?: number;
    }
    interface IPerson {
        Checked: boolean;
        FirstName: string;
        LastName: string;
        Email: string;
    }
}
declare module VacationApproval {
    /**
    * YUIDoc_comment
    *
    * @class Person
    * @constructor
    **/
    class BusinessRules {
        public Data: IVacationApprovalData;
        private paramService;
        public CLASS_NAME: string;
        public EmployeeValidator: any;
        public Deputy1Validator: any;
        public Deputy2Validator: any;
        public DurationValidator: any;
        public DeputyDiffNamesValidator: any;
        public MainValidator: any;
        public Errors: any;
        constructor(Data: IVacationApprovalData, paramService: any);
        public Validate(): void;
        private createMainValidator();
        private createDurationValidator();
        private createPersonValidator();
    }
}