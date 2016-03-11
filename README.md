# grunt-changed

[![Build Status](https://travis-ci.org/researchgate/grunt-changed.svg?branch=master)](https://travis-ci.org/researchgate/grunt-changed)
[![npm](https://img.shields.io/npm/v/grunt-changed.svg)](https://www.npmjs.com/package/grunt-changed)

Configure [Grunt](http://gruntjs.com/) tasks to run with changed file contents only.

**Synopsis:**  The [`changed`](#changed) task will configure another task to run with `src` files that have *a)* different content than on the previous run (based on md5 hash).  See below for examples and more detail. This library is heavily inspired by and based on [`grunt-newer`](https://npmjs.org/package/grunt-newer)

## Getting Started
This plugin requires at least Grunt `0.4.1` and is also compatible to version `1.0.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [`gruntfile.js`](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-changed --save-dev
```

Once the plugin has been installed, it may be enabled inside your `gruntfile.js` with this line:

```js
grunt.loadNpmTasks('grunt-changed');
```

<a name="changed"></a>
## The `changed` task

The `changed` task doesn't require any special configuration.  To use it, just add `changed` as the first argument when running other tasks.

For example, if you want to use [Uglify](https://npmjs.org/package/grunt-contrib-uglify) to minify your source files only when one or more of them is changed compared to the previous run, configure the `uglify` task as you would otherwise, and then register a task with `changed` at the front.

```js
  grunt.initConfig({
    uglify: {
      all: {
        files: {
          'dest/app.min.js': ['src/**/*.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-changed');

  grunt.registerTask('minify', ['changed:uglify:all']);
```

With the above configuration the `minify` task will only run `uglify` if one or more of the `src/**/*.js` files changed after the last run.

The `changed` task can also be used with tasks that don't generate any `dest` files.

For example, if you want to run [JSHint](https://npmjs.org/package/grunt-contrib-jshint) on only those files that have been modified since the last successful run, configure the `jshint` task as you would otherwise, and then register a task with `changed` at the front.

```js
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: {
        src: 'src/**/*.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-changed');

  grunt.registerTask('lint', ['changed:jshint:all']);
```

With the above configuration, running `grunt lint` will configure your `jshint:all` task to use only files in the `jshint.all.src` config that have been modified since the last successful run of the same task.  The first time the `jshint:changed:all` task runs, all source files will be used.  After that, only the files you modify will be run through the linter.

Another example is to use the `changed` task in conjunction with `watch`.  For example, you might want to set up a watch to run a linter on all your `.js` files whenever one changes.  With the `changed` task, instead of re-running the linter on all files, you only need to run it on the files that changed.

```js
  var srcFiles = 'src/**/*.js';

  grunt.initConfig({
    jshint: {
      all: {
        src: srcFiles
      }
    },
    watch: {
      all: {
        files: srcFiles,
        tasks: ['changed:jshint:all']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-changed');

```

With the above configuration, running `grunt jshint watch` will first lint all your files with `jshint` and then set up a watch.  Whenever one of your source files changes, the `jshint` task will be run on just the modified file.

## Options for the `changed` task

In most cases, you shouldn't need to add any special configuration for the `changed` task.  Just `grunt.loadNpmTasks('grunt-changed')` and you can use `changed` as a prefix to your other tasks.  The options below are available for advanced usage.

#### <a id="optionscache">options.cache</a>
 * type: `string`
 * default: `node_modules/grunt-changed/.cache`

To keep track of timestamps for successful runs, the `changed` task writes to a cache directory.  The default is to use a `.cache` directory within the `grunt-changed` installation directory.  If you need timestamp info to be written to a different location, configure the task with a `cache` option.

Example use of the `cache` option:

```js
  grunt.initConfig({
    changed: {
      options: {
        cache: 'path/to/custom/cache/directory'
      }
    }
  });
```

## That's it

Please [submit an issue](https://github.com/researchgate/grunt-changed/issues) if you encounter any trouble.  Contributions or suggestions for improvements welcome!

## Known limitations

The `changed` task relies on Grunt's convention for specifying [`src`/`dest` mappings](http://gruntjs.com/configuring-tasks#files).  So it should be expected to work with two types of tasks:

Tasks that specify `src` files: The task prefixed by `changed` will be configured to run with `src` files that have changed content to the last run (based on md5 hash of files).


