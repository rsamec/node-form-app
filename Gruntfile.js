/**
 * Created by rsamec on 27.7.2014.
 */

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        complexity: {
            generic: {
                src: ['src/**/*.js'],
                options: {
                    breakOnErrors:false,
                    errorsOnly: false,
                    cyclometric: 6,       // default is 3
                    halstead: 16,         // default is 8
                    maintainability: 100  // default is 100
                }
            }
        },
        jshint: {
            all: [
                'Gruntfile.js',
                'src/**/*.js'
                //'test/**/*.js'
            ],
            options: {
                jshintrc: '.jshintrc',
                force:false
            }
        },
        mochacli: {
            all: ['test/**/*.js'],
            options: {
                reporter: 'spec',
                ui: 'bdd'
            }
        },
        watch: {
            js: {
                files: ['**/*.js', '!node_modules/**/*.js'],
                tasks: ['default'],
                options: {
                    nospawn: true
                }
            }
        },

        typedoc: {
            build: {
                options: {
                    module: 'commonjs',
                    out: './docs',
                    name: 'Business rules',
                    target: 'es5'
                },
                src: ['./src/**/*']
            }
        },
        typescript: {
            base: {
                src: ['src/models/vacationApproval/BusinessRules.ts'],
                dest: 'dist/vacationApproval/vacationApproval.js',
                options: {
                    //module: 'amd',
                    target: 'es5',
                    declaration: true,
                    comments:true
                }
            },
            invoice: {
                src: ['src/models/invoice/BusinessRules.ts'],
                dest: 'dist/invoice/invoice.js',
                options: {
                    //module: 'amd',
                    target: 'es5',
                    declaration: true,
                    comments:true
                }
            },
            test:{
                src: ['test/models/vacationApproval/*.ts'],
                dest: '',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    declaration: false,
                    comments:true
                }
            }
        },
        uglify: {
            options: {
                // the banner is inserted at the top of the output
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/vacationApproval/vacationApproval.min.js': ['<%= typescript.base.dest %>'],
                    'dist/vacationApproval/node-vacationApproval.min.js': ['dist/vacationApproval/node-vacationApproval.js']

                }
            }
        },
        copy: {
            main: {
                files: [
                    // includes files within path
                    {expand: true, src: ['src/models/vacationApproval/locales/*'], dest: 'dist/vacationApproval/i18n', filter: 'isFile',flatten:true}

                    // includes files within path and its sub-directories
                    //{expand: true, src: ['src/models/vacationApproval/locales/**'], dest: 'dest/'},

                    // makes all src relative to cwd
                    //{expand: true, cwd: 'path/', src: ['**'], dest: 'dest/'},

                    // flattens results to a single level
                    //{expand: true, flatten: true, src: ['path/**'], dest: 'dest/', filter: 'isFile'}
                ]
            }
        },
        concat: {
            dist: {
                files: {
                    'dist/vacationApproval/node-vacationApproval.js': ['<%= typescript.base.dest %>', 'src/models/vacationApproval/commonjs.js']
                }
            },
            invoice: {
                files: {
                    'dist/invoice/node-invoice.js': ['<%= typescript.invoice.dest %>', 'src/models/invoice/commonjs.js']
                }
            }
         }
    });

    grunt.loadNpmTasks('grunt-complexity');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-mocha-cli');
    grunt.loadNpmTasks('grunt-typedoc');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');


    grunt.registerTask('test', ['typescript:test', 'mochacli', 'watch']);
    grunt.registerTask('ci', ['complexity', 'jshint', 'mochacli']);
    grunt.registerTask('default', ['test']);
    grunt.registerTask('dist', ['typescript:base','concat:dist','uglify','copy']);
    grunt.registerTask('invoice', ['typescript:invoice','concat:invoice']);
    grunt.registerTask('document', ['typedoc']);
};
