/* jshint asi: true, node: true, laxbreak: true, laxcomma: true, undef: true, unused: true */

var glob         = require('glob')
var path         = require('path')
var pluralize    = require('pluralize')
var underscore   = require('underscore')


module.exports = {}

var categories = [ 'listeners', 'observers', 'subscribers', 'utilities' ]

categories.forEach(function (category) {
  var singular = pluralize(category, 1)
  var cwd = path.join(__dirname, category)

  module.exports[category] = {}

  glob.sync(singular + '-*.js', { cwd: cwd }).forEach(function (file) {
    var u = path.basename(file.substring(singular.length + 1), '.js')

    module.exports[category][u] = require(path.join(cwd, file))
  })
})

categories.forEach(function (category) {
  underscore.keys(module.exports[category]).forEach(function (name) {
    if (module.exports[category][name].once) module.exports[category][name].once(module.exports)
  })
})
