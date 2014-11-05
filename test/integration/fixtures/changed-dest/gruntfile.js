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
        files: [{
          expand: true,
          cwd: 'src/',
          src: 'one.coffee',
          dest: 'dest/',
          ext: '.js'
        }]
      },
      all: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: '**/*.coffee',
          dest: 'dest/',
          ext: '.js'
        }]
      },
      none: {
        src: []
      }
    },
    log: {
      all: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: '**/*.coffee',
          dest: 'dest/',
          ext: '.js'
        }],
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
      // run the log task with changed, expect all files
      'changed:log',
      'assert:that:modified:all',

      // modify one file
      'modified:one',

      // run assert task again, expect one file
      'changed:log',
      'assert:that:modified:one',

      // modify nothing, expect no files
      'changed:log',
      'assert:that:modified:none'

    ]);

  });

};
