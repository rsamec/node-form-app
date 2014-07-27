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
                'src/**/*.js',
                'test/**/*.js'
            ],
            options: {
                jshintrc: '.jshintrc'
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
                    name: 'ValidationEngine',
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
            }
        },
//      typescript: {
//          base: {
//              src: ['src/customValidators/*.ts','src/localization/*.ts'],
//              dest: 'distNode/lib',
//              options: {
//                  module: 'commonjs',
//                  target: 'es5',
//                  declaration: false,
//                  after:['uglify'],
//                  comments:false,
//                  basePath:'src'
//              }
//          }
//      },
        uglify: {
            options: {
                // the banner is inserted at the top of the output
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/vacationApproval/vacationApproval.min.js': ['<%= typescript.base.dest %>']
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


    grunt.registerTask('test', [ 'mochacli', 'watch']);
    grunt.registerTask('ci', ['complexity', 'jshint', 'mochacli']);
    grunt.registerTask('default', ['test']);
    grunt.registerTask('dist', ['typescript','uglify']);
    grunt.registerTask('document', ['typedoc']);
};