///<reference path='../../../typings/q/q.d.ts'/>
"use strict";
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
        Approval?:IApproval;
    }

    /**
     * Data structure for vacation duration.
     */
    export interface IDuration {
        From:Date;
        To:Date;
        Days?:number;
        ExcludedDays?:Array<Date>;
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
     * Data structure for approval data.
     */
    export interface IApproval{
        Approved:boolean;
        ApprovedDate:Date;
        ApprovedBy:IPerson;
    }


    /**
     * External service that return true if there is conflict with deputies approved days.
     */
    export interface IVacationDeputyService {
        isAcceptable(data:VacationApproval.IVacationApprovalData):Q.Promise<boolean>
    }

}