var path = require('path');


/**
 * @param {Object} grunt Grunt.
 */
module.exports = function(grunt) {

  var log = [];

  grunt.initConfig({
    changed: {
      options: {
        cache: path.join(__dirname, '.cache')
      }
    },
    modified: {
      one: {
        src: 'src/one.js',
        dest: 'dist/dest.js'
      },
      all: {
        src: 'src/**/*.js',
        dest: 'dist/dest.js'
      },
      none: {
        src: [],
        dest: 'dist/dest.js'
      }
    },
    log: {
      all: {
        src: 'src/**/*.js',
        dest: 'dist/dest.js',
        getLog: function() {
          return log;
        }
      }
    },
    assert: {
      that: {
        getLog: function() {
          return log;
        }
      }
    }
  });

  grunt.loadTasks('../../../tasks');
  grunt.loadTasks('../../../test/integration/tasks');

  grunt.registerTask('default', function() {

    grunt.task.run([
      // run the assert task with changed, expect all files
      'changed:log',
      'assert:that:modified:all',

      // modify one file
      'modified:one',

      // run assert task again, expect one file
      'changed:log',
      'assert:that:modified:all',

      // modify nothing, expect no files
      'changed:log',
      'assert:that:modified:none'

    ]);

  });

};
