///<reference path='../../../typings/mocha/mocha.d.ts'/>
///<reference path='../../../typings/node/node.d.ts'/>
///<reference path='../../../typings/underscore/underscore.d.ts'/>
///<reference path='../../../typings/q/q.d.ts'/>
///<reference path='../../../typings/node-form/node-form.d.ts'/>

///<reference path='../../../dist/vacationApproval/vacationApproval.d.ts'/>

import Validation = require('node-form');
var expect = require('expect.js');
var _:UnderscoreStatic = require('underscore');
import Q = require('q');

var moment = require('moment');
var VacationApproval = require('../../../dist/vacationApproval/vacationApproval.js');


/**
 * @name Custom async property validator example
 * @description
 * Return true for valid BranchOfBusiness, otherwise return false.
 *
 * To create a async custom validator you have to implement IAsyncPropertyValidator interface.
 * Async custom validator must have property isAsync set to true;
 */
class FakeVacationDeputyService {

    /**
     * It checks first deputy in the vacation request with list of all approved vacations that they are not in conflict.
     * @param an {any} vacation request to check
     * @returns {boolean} return true for valid value, otherwise false
     */
    isAcceptable(data:VacationApproval.IVacationApprovalData):Q.Promise<boolean> {
        var deferred = Q.defer<boolean>();

        setTimeout(function () {

            //check if there is something to validate -> check required data for validation
            var namesAreValid = data.Deputy1.FirstName != undefined && data.Deputy1.LastName != undefined;
            var datesAreValid =  _.isDate(data.Duration.From) && _.isDate(data.Duration.To);
            if (!namesAreValid || !datesAreValid) {
                //nothing to validate
                deferred.resolve(true);
                return;
            }

            //fetch items form somewhere - eg. db
            var items =
                [
                    { "approvedDays": [moment(), moment().add('days',1).startOf('days')], "fullName": "John Smith" },
                    { "approvedDays": [moment().add('days',1).startOf('days'),  moment().add('days',2).startOf('days')], "fullName": "Paul Neuman" },
                ];

            //find out range
            var durationRange = moment().range(data.Duration.From, data.Duration.To);

            //validation
            var hasSomeConflicts = _.some(items, function (item) {
                return (item.fullName == (data.Deputy1.FirstName + " " + data.Deputy1.LastName) &&
                _.some(item.approvedDays, function(approvedDay){
                   return durationRange.contains(approvedDay.startOf('days'));
                }));
            });
            deferred.resolve(!hasSomeConflicts);
        }, 1000);

        return deferred.promise;
    }
}


describe('business rules for vacation approval', function () {
    //create test data
    var data;

    //business rules for vacation approval
    var businessRules;

    beforeEach(function () {
        //setup
        data = {};
        businessRules = new VacationApproval.BusinessRules(data, new FakeVacationDeputyService());
    });

    describe('employee', function () {

        describe('first name + last name', function () {

            it('fill no names', function () {
                //when
                data.Employee = {};

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Employee"].Errors["FirstName"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Employee"].Errors["LastName"].HasErrors).to.equal(true);
            });

            it('fill empty names', function () {
                //when
                data.Employee = {
                    FirstName: '',
                    LastName: ''
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Employee"].Errors["FirstName"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Employee"].Errors["LastName"].HasErrors).to.equal(true);
            });

            it('fill long names', function () {
                //when
                data.Employee = {
                    FirstName: 'too looooooooooooong first name',
                    LastName: 'too looooooooooooong last name'
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Employee"].Errors["FirstName"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Employee"].Errors["LastName"].HasErrors).to.equal(true);
            });

            it('fill some names', function () {
                //when
                data.Employee = {
                    FirstName: 'John',
                    LastName: 'Smith'
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Employee"].Errors["FirstName"].HasErrors).to.equal(false);
                expect(businessRules.Errors.Errors["Employee"].Errors["LastName"].HasErrors).to.equal(false);
            });
        });
    });

    describe('duration', function () {

        describe('from and to fields', function () {
            it('fill no dates', function () {
                //when
                data.Duration = {};

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(true);
            });


            it('fill empty dates', function () {
                //when
                //when
                data.Duration = {
                    From: '',
                    To: ''
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(true);
            });

            it('fill dates before today', function () {
                //when
                //when
                data.Duration = {
                    From: moment(new Date()).add({days: -1}).toDate(),
                    To: moment(new Date()).add({days: -1}).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(true);
            });

            it('fill dates qreater than one year from today', function () {
                //when
                //when
                data.Duration = {
                    From: moment(new Date()).add({years: 1, days: 1}).toDate(),
                    To: moment(new Date()).add({years: 1, days: 1}).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(true);
            });

            it('fill dates qreater than one year from today', function () {
                //when
                //when
                data.Duration = {
                    From: moment(new Date()).add({years: 1, days: 1}).toDate(),
                    To: moment(new Date()).add({years: 1, days: 1}).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(true);
            });

            it('fill today', function () {
                //when
                //when
                data.Duration = {
                    From: new Date(),
                    To: new Date()

                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(false);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(false);
            });

            it('fill one year from today', function () {
                //when
                //when
                data.Duration = {
                    From: moment(new Date()).add({years: 1}).toDate(),
                    To: moment(new Date()).add({years: 1}).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["From"].HasErrors).to.equal(false);
                expect(businessRules.Errors.Errors["Duration"].Errors["To"].HasErrors).to.equal(false);
            });

        });

        describe('duration in days', function () {
            it('zero duration', function () {
                //when
                //when
                data.Duration = {
                    From: new Date(),
                    To: new Date()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["VacationDuration"].HasErrors).to.equal(true);
            });

            it('negative duration', function () {
                //when
                //when
                data.Duration = {
                    From: new Date(),
                    To: moment(new Date()).add({ days: -1 }).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["VacationDuration"].HasErrors).to.equal(true);
            });

            it('minimal duration', function () {
                //when
                //when
                data.Duration = {
                    From: new Date(),
                    To: moment(new Date()).add({ days: 1 }).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["VacationDuration"].HasErrors).to.equal(false);
            });

            it('maximal duration 30 days', function () {
                //when
                //when
                data.Duration = {
                    From: new Date(),
                    To: moment(new Date()).add({ days: 30 }).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["VacationDuration"].HasErrors).to.equal(false);
            });

            it('too big duration 31 days', function () {
                //when
                //when
                data.Duration = {
                    From: new Date(),
                    To: moment(new Date()).add({ days: 31 }).toDate()
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Duration"].Errors["VacationDuration"].HasErrors).to.equal(true);
            });
        });
    });

    describe('deputy', function () {

        describe('first name + last name', function () {

            it('fill no names', function () {
                //when
                data.Deputy1 = {};

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Deputy1"].Errors["FirstName"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Deputy1"].Errors["LastName"].HasErrors).to.equal(true);
            });

            it('fill empty names', function () {
                //when
                data.Deputy1 = {
                    FirstName: '',
                    LastName: ''
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Deputy1"].Errors["FirstName"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Deputy1"].Errors["LastName"].HasErrors).to.equal(true);
            });

            it('fill long names', function () {
                //when
                data.Deputy1 = {
                    FirstName: 'too looooooooooooong first name',
                    LastName: 'too looooooooooooong last name'
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Deputy1"].Errors["FirstName"].HasErrors).to.equal(true);
                expect(businessRules.Errors.Errors["Deputy1"].Errors["LastName"].HasErrors).to.equal(true);
            });

            it('fill some names', function () {
                //when
                data.Deputy1 = {
                    FirstName: 'John',
                    LastName: 'Smith'
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Deputy1"].Errors["FirstName"].HasErrors).to.equal(false);
                expect(businessRules.Errors.Errors["Deputy1"].Errors["LastName"].HasErrors).to.equal(false);
            });
        });

        describe('email', function () {

            it('fill no email', function () {
                //when
                data.Deputy1 = {};

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Deputy1"].Errors["Email"].HasErrors).to.equal(true);
            });

            it('fill wrong email', function () {
                //when
                data.Deputy1 = {
                    Email: 'jsmith.com'
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Deputy1"].Errors["Email"].HasErrors).to.equal(true);
            });

            it('fill some email', function () {
                //when
                data.Deputy1 = {
                    Email: 'jsmith@gmail.com'
                };

                //exec
                businessRules.Validate();

                //verify
                expect(businessRules.Errors.Errors["Deputy1"].Errors["Email"].HasErrors).to.equal(false);
            });
        });
    });

    describe('deputy check with list of all approved vacations that they are not in conflict', function () {

        it('fill employee with vacation and confict in days', function (done) {
            //when
            data.Deputy1 = {
                FirstName:'John',
                LastName:'Smith'
            };

            data.Duration = {
                From :new Date(),
                To:moment(new Date()).add({ days: 1 }).toDate()
            }

            //exec
            var promiseResult = businessRules.DeputyConflictsValidator.ValidateAsync(businessRules.Data);


            promiseResult.then(function (response) {

                //verify
                expect(businessRules.Errors.Errors["DeputyConflict"].HasError).to.equal(true);

                done();

            }).done(null,done);


        });

        it('fill employee with vacation and confict in days', function (done) {
            //when
            data.Deputy1 = {
                FirstName:'John',
                LastName:'Smith'
            };

            data.Duration = {
                From :moment(new Date()).add({ days: 2 }).toDate(),
                To:moment(new Date()).add({ days:3 }).toDate()
            }

            //exec
            var promiseResult = businessRules.DeputyConflictsValidator.ValidateAsync(businessRules.Data);


            promiseResult.then(function (response) {

                //verify
                expect(businessRules.Errors.Errors["DeputyConflict"].HasError).to.equal(false);

                done();

            }).done(null,done);
        });

    });
});