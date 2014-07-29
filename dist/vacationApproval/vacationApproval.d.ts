/// <reference path="../../typings/moment/moment.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="../../typings/node-form/node-form.d.ts" />
/// <reference path="../../typings/q/Q.d.ts" />
declare module VacationApproval {
    /**
    *  It validates passed date against constant from and to interval.
    *  You can check that passed date is greater than now and lower than one year for now.
    */
    class FromToDateValidator implements Validation.IPropertyValidator {
        public isAcceptable(s: any): boolean;
        private isValid(now, then, compareOperator);
        /**
        * It formats error message.
        * @param config localization strings
        * @param args dynamic parameters
        * @returns {string} error message
        */
        public customMessage(config: any, args: any): string;
        public tagName: string;
        /**
        *  Ignore time part of date when compare dates.
        */
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
    /**
    * Data structure for vacation approval.
    */
    interface IVacationApprovalData {
        Employee?: IPerson;
        Deputy1?: IPerson;
        Deputy2?: IPerson;
        Duration?: IDuration;
        Comment?: string;
    }
    /**
    * Data structure for vacation duration.
    */
    interface IDuration {
        From: Date;
        To: Date;
        Days?: number;
    }
    /**
    * Data structure for person.
    */
    interface IPerson {
        Checked?: boolean;
        FirstName: string;
        LastName: string;
        Email?: string;
    }
    /**
    * External service that return true if there is conflict with deputies approved days.
    */
    interface IVacationDeputyService {
        isAcceptable(data: IVacationApprovalData): Q.Promise<boolean>;
    }
}
declare module VacationApproval {
    /**
    * Business rules for vacation approval.
    *
    * @class
    * @constructor
    **/
    class BusinessRules {
        public Data: IVacationApprovalData;
        private vacationDeputyService;
        /**
        * Business rules for employee requested the vacation.
        */
        public EmployeeValidator: any;
        /**
        * Business rules for first deputy for employee having the vacation.
        */
        public Deputy1Validator: any;
        /**
        * Business rules for second deputy for employee having the vacation.
        */
        public Deputy2Validator: any;
        /**
        * Business rules for duration of vacation.
        */
        public DurationValidator: any;
        /**
        *  Deputy conflict - employee that have approved vacation and its someones's deputy at the same days.
        */
        public DeputyConflictsValidator: any;
        /**
        * All business rules for the vacation approval.
        */
        public MainValidator: any;
        /**
        * Return the state of all business rules.
        */
        public Errors: any;
        constructor(Data: IVacationApprovalData, vacationDeputyService: IVacationDeputyService);
        /**
        * Executes all business rules.
        */
        public Validate(): void;
        private createMainValidator();
        private createDurationValidator();
        private createPersonValidator();
    }
}
