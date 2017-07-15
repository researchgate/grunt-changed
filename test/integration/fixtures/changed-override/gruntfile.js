var assert = require('assert');
var path = require('path');


/**
 * @param {Object} grunt Grunt.
 */
module.exports = function (grunt) {

  var log = [];

  grunt.initConfig({
    changed: {
      options: {
        cache: path.join(__dirname, '.cache'),
        override: function (details, include) {
          assert.equal(details.task, 'log');
          assert.equal(details.target, 'all');
          assert.equal(typeof details.path, 'string');

          // if called with three.js, include it
          if (path.basename(details.path) === 'three.js') {
            include(true);
          } else {
            include(false);
          }
        }
      }
    },
    modified: {
      one: {
        src: 'src/one.js'
      },
      oneThree: {
        src: ['src/one.js', 'src/three.js']
      },
      three: {
        src: 'src/three.js'
      },
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
        getLog: function () {
          return log;
        }
      }
    },
    assert: {
      that: {
        getLog: function () {
          return log;
        }
      }
    }
  });

  grunt.loadTasks('../../../tasks');
  grunt.loadTasks('../../../test/integration/tasks');

  grunt.registerTask('default', function () {

    grunt.task.run([
      // run the log task with changed, expect all files
      'changed:log',
      'assert:that:modified:all',

      // modify one file
      'modified:one',

      // run log task again, expect one.js and three.js (due to override)
      'changed:log',
      'assert:that:modified:oneThree',

      // modify nothing, expect three.js (due to override)
      'changed:log',
      'assert:that:modified:three'

    ]);

  });

};
