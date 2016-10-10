/* jshint asi: true */

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

var upnp = module.exports.subscribers.upnp
upnp.init()
upnp.Subscribe({ host     : '192.168.1.109'
               , port     : 1400
               , endPoint : '/DeviceProperties/Event'
               , method   : 'NOTIFY'
               , verboseP : true
               }).on('message', function(options, message) {
console.log('\nindex\noptions=' + JSON.stringify(options, null, 2))
console.log('message=' + JSON.stringify(message, null, 2))
this.destroy()
})

