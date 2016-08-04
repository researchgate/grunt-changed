module.exports = function(grunt) {

  var gruntfileSrc = 'gruntfile.js';
  var tasksSrc = ['tasks/**/*.js', 'lib/**/*.js'];
  var testSrc = 'test/**/*.spec.js';
  var fixturesJs = 'test/integration/fixtures/**/*.js';
  var fixturesAll = 'test/integration/fixtures/**/*';

  grunt.initConfig({

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: [testSrc]
      }
    },

    jshint: {
      options: {
        jshintrc: true
      },
      gruntfile: {
        src: gruntfileSrc
      },
      tasks: {
        src: tasksSrc
      },
      tests: {
        src: testSrc
      },
      fixturesJs: {
        src: fixturesJs
      }
    },

    watch: {
      tasks: {
        files: tasksSrc,
        tasks: ['cafemocha']
      },
      tests: {
        files: testSrc,
        tasks: ['changed:cafemocha']
      },
      fixturesAll: {
        files: fixturesAll,
        tasks: ['cafemocha']
      },
      allJs: {
        files: [gruntfileSrc, tasksSrc, testSrc, fixturesJs],
        tasks: ['changed:jshint']
      }
    }

  });

  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', ['changed:jshint', 'mochaTest']);

  grunt.registerTask('default', 'test');

};
