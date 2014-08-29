///<reference path='typings/business-rules-engine/business-rules-engine.d.ts'/>
///<reference path='typings/node/node.d.ts'/>
///<reference path='typings/underscore/underscore.d.ts'/>
///<reference path='typings/q/q.d.ts'/>
///<reference path='node_modules/br-hobbies/business-rules.d.ts'/>
var _ = require('underscore');

var Hobbies = require('br-hobbies');
var mongoose = require('mongoose');

//fake our employee db
var employees = [
    { FirstName: 'John', LastName: 'Smith' },
    { FirstName: 'Goerge', LastName: 'Podolsky' },
    { FirstName: 'Jan', LastName: 'Novak' },
    { FirstName: 'Karel', LastName: 'Abraham' },
    { FirstName: 'Josef', LastName: 'Blaha' }
];

//connect to mongo
mongoose.connect('mongodb://rsamec:[password]@ds059908.mongolab.com:59908/documents');

//create a mongoose model
var Doc = mongoose.model('docs', {
    shortName: String,
    name: String,
    desc: String,
    data: Object,
    created: Date,
    updated: Date });

//create document header
var docHeader = {
    name: 'hobbies',
    created: new Date()
};

//iterate list of employee
_.each(employees, function (employee) {
    //create  data
    var data = {
        Person: {
            FirstName: employee.FirstName,
            LastName: employee.LastName,
            Email: employee.FirstName.charAt(1) + employee.LastName + "@gmail.com"
        },
        Hobbies: [
            { HobbyName: "English", Frequency: Hobbies.HobbyFrequency.Weekly, Paid: true, Recommendation: true },
            { HobbyName: "Swimming", Frequency: Hobbies.HobbyFrequency.Monthly, Paid: false, Recommendation: true }
        ]
    };

    //create business rules
    var businessRules = new Hobbies.BusinessRules(data);

    //execute business rules
    var promise = businessRules.Validate();

    //verify results
    return promise.then(function (result) {
        //log if any errors encounters
        if (result.HasErrors) {
            console.log('error encounters at employee: ' + employee.LastName);
            console.log(result.ErrorMessage);
            return;
        }

        //create mongo document -> combine document header with document data
        var document = new Doc(_.extend(docHeader, { desc: employee.FirstName + " " + employee.LastName, data: data }));

        //save to Db
        document.save(function (err) {
            if (err) {
                console.log('error encounters at employee: ' + employee.LastName);
            }
            ;
        });
    });
});
//# sourceMappingURL=hobbiesImport.js.map
