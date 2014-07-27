module VacationApproval {

    //Data interface
    export interface IVacationApprovalData {
        Employee?:IPerson;
        Deputy1?:IPerson;
        Deputy2?:IPerson;
        Duration?:IDuration;
        Comment?:string;
    }

    export interface IDuration {
        From:Date;
        To:Date;
        Days?:number;
    }
    export interface IPerson {
        Checked:boolean;
        FirstName:string;
        LastName:string;
        Email?:string;
    }
}