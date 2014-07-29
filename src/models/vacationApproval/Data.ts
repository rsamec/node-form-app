///<reference path='../../../typings/q/q.d.ts'/>

module VacationApproval {

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

    /**
     * External service that return true if there is conflict with deputies approved days.
     */
    export interface IVacationDeputyService {
        isAcceptable(data:VacationApproval.IVacationApprovalData):Q.Promise<boolean>
    }
}