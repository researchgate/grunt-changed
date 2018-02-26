var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var async = require('async');

/**
 * Get path to cached file hash for a target.
 * @param {string} cacheDir Path to cache dir.
 * @param {string} taskName Task name.
 * @param {string} targetName Target name.
 * @param {string} filePath Path to file.
 * @return {string} Path to hash.
 */
var getHashPath = exports.getHashPath = function (cacheDir, taskName,
  targetName,
  filePath) {
  var hashedName = crypto.createHash('md5').update(filePath).digest('hex');
  var dir = path.join(cacheDir, taskName, targetName, 'hashes');

  if (!fs.existsSync(dir)) {
    mkdirp.sync(dir);
  }

  return path.join(cacheDir, taskName, targetName, 'hashes', hashedName);
};


/**
 * Get an existing hash for a file (if it exists).
 * @param {string} filePath Path to file.
 * @param {string} cacheDir Cache directory.
 * @param {string} taskName Task name.
 * @param {string} targetName Target name.
 * @param {function(Error, string} callback Callback called with an error and
 *     file hash (or null if the file doesn't exist).
 */
var getExistingHash = exports.getExistingHash = function(filePath, cacheDir,
    taskName, targetName, callback) {
  var hashPath = getHashPath(cacheDir, taskName, targetName, filePath);
  fs.exists(hashPath, function(exists) {
    if (!exists) {
      return callback(null, null);
    }
    fs.readFile(hashPath, callback);
  });
};


/**
 * Generate a hash (md5sum) of a file contents.
 * @param {string} filePath Path to file.
 * @param {function(Error, string)} callback Callback called with any error and
 *     the hash of the file contents.
 */
var generateFileHash = exports.generateFileHash = function(filePath, callback) {
  var md5sum = crypto.createHash('md5');
  var stream = new fs.ReadStream(filePath);
  stream.on('data', function(chunk) {
    md5sum.update(chunk);
  });
  stream.on('error', callback);
  stream.on('end', function() {
    callback(null, md5sum.digest('hex'));
  });
};

var writeFileHash = function (
    cacheDir, taskName, targetName,
    filePath, hash, callback
) {
  var hashPath = getHashPath(cacheDir, taskName, targetName, filePath);
  fs.writeFile(hashPath, hash, callback);
};

/**
 * Filter files based on hashed contents.
 * @param {Array.<string>} paths List of paths to files.
 * @param {string} cacheDir Cache directory.
 * @param {string} taskName Task name.
 * @param {string} targetName Target name.
 * @param {function(string, function(boolean))} override Override.
 * @param {function(Error, Array.<string>)} callback Callback called with any
 *     error and a filtered list of files that only includes files with hashes
 *     that are different than the cached hashes for the same files.
 */
var filterPathsByHash = exports.filterPathsByHash = function(
    paths, cacheDir,
    taskName, targetName, override, callback
) {
  async.filter(paths, function(filePath, done) {
    async.parallel({
      previous: function(cb) {
        getExistingHash(filePath, cacheDir, taskName, targetName, cb);
      },
      current: function(cb) {
        generateFileHash(filePath, cb);
      }
    }, function(err, hashes) {
      if (err) {
        return callback(err);
      }
      var changed = String(hashes.previous) !== String(hashes.current);
      if (changed) {
          done(null, true);
        } else {
          override(filePath, function (newChanged) {
            if (newChanged) {
                done(null, true);
            } else {
              done(null, false);
            }
          });
        }
      });
    }, callback);
};


/**
 * Filter a list of file config objects based on comparing hashes of src files.
 * @param {Array.<Object>} files List of file config objects.
 * @param {string} taskName Task name.
 * @param {string} targetName Target name.
 * @param {function(string, function(boolean))} override Override.
 * @param {function(Error, Array.<Object>)} callback Callback called with a
 *     filtered list of file config objects.  Object returned will only include
 *     src files with hashes that are different than any cached hashes.  Config
 *     objects with no src files will be filtered from the list.
 */
exports.filterFilesByHash = function(
  files, cacheDir, taskName, targetName, override, callback
) {
  async.map(files, function(obj, done) {
    filterPathsByHash(obj.src, cacheDir, taskName, targetName, override,
      function(err, src) {
        if (obj.dest && !fs.existsSync(obj.dest)) {
          done(null, obj);
        } else if (src && src.length > 0) {
          if (
              obj.dest && !(obj.src.length === 1 && obj.dest === obj.src[0])
          ) {
            done(null, obj);
          } else {
            done(
                null, {
                  src: src,
                  dest: obj.dest
                }
            );
          }
        } else {
          done(null, null);
        }
      }
    );
  }, function (e, mappedFiles) {
    async.filter(
        mappedFiles,
        function (obj, filterDone) {
          if (obj) {
            filterDone(null, true);
          } else {
            filterDone(null, false);
          }
        }, callback
    );

  });
};


var doGenerateFileHashes = function (
    paths, cacheDir,
    taskName, targetName, override, callback
) {
    async.filter(paths, function (filePath, done) {
        async.parallel({
            current: function (cb) {
                generateFileHash(filePath, cb);
            }
        }, function (err, hashes) {
            if (err) {
                return callback(err);
            }
            writeFileHash(
                cacheDir,
                taskName,
                targetName,
                filePath,
                hashes.current,
                done
            );
        });
    }, callback);
};


exports.generateFileHashes = function (
    files, cacheDir, taskName, targetName, override, callback
) {
    async.map(files, function (obj, done) {
        doGenerateFileHashes(obj.src, cacheDir, taskName, targetName, override,
            function (err, src) {
                if (obj.dest && !fs.existsSync(obj.dest)) {
                    done(null, obj);
                } else if (src && src.length > 0) {
                    if (
                        obj.dest &&
                        !(obj.src.length === 1 && obj.dest === obj.src[ 0 ])
                    ) {
                        done(null, obj);
                    } else {
                        done(
                            null, {
                                src: src,
                                dest: obj.dest
                            }
                        );
                    }
                } else {
                    done(null, null);
                }
            }
        );
    }, function (e, mappedFiles) {
        async.filter(
            mappedFiles,
            function (obj, generateDone) {
                if (obj) {
                    generateDone(null, true);
                } else {
                    generateDone(null, false);
                }
            }, callback
        );

    });
};
