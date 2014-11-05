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
      all: {
        src: 'src/**/*.js'
      },
      none: {
        src: []
      }
    },
    log: {
      all: {
        src: 'src/**/*.js',
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
      // run the task without changed, expect all files
      'log',
      'assert:that:modified:all',

      // run the task with changed, expect all files
      'changed:log',
      'assert:that:modified:all',

      // run the task again without modifying any, expect no files
      'changed:log',
      'assert:that:modified:none'

    ]);

  });

};
