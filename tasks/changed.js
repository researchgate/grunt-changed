var path = require('path');
var rimraf = require('rimraf');
var util = require('../lib/util');

var counter = 0;
var configCache = {};

function cacheConfig(config, changedFiles, override) {
  ++counter;
  configCache[counter] = {
      config: config,
      changedFiles: changedFiles,
      override: override
  };
  return counter;
}

function pluckConfig(id) {
  if (!configCache.hasOwnProperty(id)) {
    throw new Error('Failed to find id in cache');
  }
  var config = configCache[id];
  delete configCache[id];
  return config;
}

function nullOverride(details, include) {
  include(false);
}

function createTask(grunt) {
  return function(taskName, targetName) {
    var tasks = [];
    var prefix = this.name;
    if (!targetName) {
      if (!grunt.config(taskName)) {
        grunt.fatal('The "' + prefix + '" prefix is not supported for aliases');
        return;
      }
      Object.keys(grunt.config(taskName)).forEach(function(targetName) {
        if (!/^_|^options$/.test(targetName)) {
          tasks.push(prefix + ':' + taskName + ':' + targetName);
        }
      });
      return grunt.task.run(tasks);
    }
    var args = Array.prototype.slice.call(arguments, 2).join(':');
    var options = this.options({
      override: nullOverride,
      cache: path.join(__dirname, '..', '.cache')
    });

    var done = this.async();

    var originalConfig = grunt.config.get([taskName, targetName]);
    var config = grunt.util._.clone(originalConfig);

    /**
     * Special handling for tasks that expect the `files` config to be a string
     * or array of string source paths.
     */
    var srcFiles = true;
    if (typeof config.files === 'string') {
      config.src = [config.files];
      delete config.files;
      srcFiles = false;
    } else if (Array.isArray(config.files) &&
        typeof config.files[0] === 'string') {
      config.src = config.files;
      delete config.files;
      srcFiles = false;
    }

    function override(filePath, include) {
      var details = {
        task: taskName,
        target: targetName,
        path: filePath,
        getExistingHash: function (fp, cb) {
          util.getExistingHash(fp,
            options.cache,
            taskName,
            targetName,
            cb);
        },
        generateFileHash: function (fp, cb) {
          util.generateFileHash(filePath,
            cb);
        }
      };
      options.override(details, include);
    }


    var files = grunt.task.normalizeMultiTaskFiles(config, targetName);
    util.filterFilesByHash(
        files,
        options.cache,
        taskName,
        targetName,
        override,
        function(e, changedFiles) {
          if (e) {
            return done(e);
          } else if (changedFiles.length === 0) {
            grunt.log.writeln('No changed files to process.');
            return done();
          }

          /**
           * If we started out with only src files in the files config,
           * transform the changedFiles array into an array of source files.
           */
          if (!srcFiles) {
            changedFiles = changedFiles.map(function(obj) {
              return obj.src;
            });
          }

          // configure target with only changed files
          config.files = changedFiles;
          delete config.src;
          delete config.dest;
          grunt.config.set([taskName, targetName], config);

          // because we modified the task config, cache the original
          var id = cacheConfig(originalConfig, changedFiles, override);

            // run the task, and attend to postrun tasks
          var qualified = taskName + ':' + targetName;
          var tasks = [
            qualified + (args ? ':' + args : ''),
            'changed-postrun:' + qualified + ':' + id + ':' + options.cache
          ];
          grunt.task.run(tasks);

          done();
        }
    );

  };
}

/** @param {Object} grunt Grunt. */
module.exports = function(grunt) {

  grunt.registerTask(
      'changed', 'Run a task with only those source files that have been ' +
      'modified since the last successful run.', createTask(grunt));

  var internal = 'Internal task.';
  grunt.registerTask(
      'changed-postrun',
      internal,
      function(taskName, targetName, id, cacheDir) {
          var done = this.async();

          var config = pluckConfig(id);
          // if cacheDir includes a ':', grunt will split it among multiple args
          cacheDir = Array.prototype.slice.call(arguments, 3).join(':');


          util.generateFileHashes(
              config.changedFiles,
              cacheDir,
              taskName,
              targetName,
              config.override,
              function (err) {
                  if (err) {
                      throw err;
                  }

                  // reconfigure task with original config
                  grunt.config.set([ taskName, targetName ], config.config);

                  done();
              }
          );

      });

  var clean = 'Remove cached hashes.';
  grunt.registerTask(
      'changed-clean', clean, function(taskName, targetName) {
        var done = this.async();

        /**
         * This intentionally only works with the default cache dir.  If a
         * custom cache dir is provided, it is up to the user to keep it clean.
         */
        var cacheDir = path.join(__dirname, '..', '.cache');
        if (taskName && targetName) {
          cacheDir = path.join(cacheDir, taskName, targetName);
        } else if (taskName) {
          cacheDir = path.join(cacheDir, taskName);
        }
        if (grunt.file.exists(cacheDir)) {
          grunt.log.writeln('Cleaning ' + cacheDir);
          rimraf(cacheDir, done);
        } else {
          done();
        }
      });

};
