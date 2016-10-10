/* jshint asi: true */

var underscore = require('underscore')

module.exports = function (options, params, callback) {
  var request, timeoutP
    , client = options.location.protocol === 'https:' ? require('https') : require('http')

  params = underscore.extend(underscore.pick(options.location, [ 'protocol', 'hostname', 'port' ]), params)
  params.method = params.method || 'GET'
  if ((params.method !== 'GET') && (params.method !== 'DELETE')
         && (params.method !== 'SUBSCRIBE') && (params.method !== 'UNSUBSCRIBE')) {
    params.headers = underscore.defaults(params.headers || {},
                                         { 'content-type': 'application/json; charset=utf-8', 'accept-encoding': '' })
  }

  request = client.request(underscore.omit(params, [ 'useProxy', 'payload' ]), function (response) {
    var body = ''

    if (timeoutP) return
    response.on('data', function (chunk) {
      body += chunk.toString()
    }).on('end', function () {
      var payload

      if (params.timeout) request.setTimeout(0)

      if (options.verboseP) {
        console.log('[ response for ' + params.method + ' ' + params.protocol + '//' + params.hostname + params.path + ' ]')
        console.log('>>> HTTP/' + response.httpVersionMajor + '.' + response.httpVersionMinor + ' ' + response.statusCode +
                   ' ' + (response.statusMessage || ''))
        underscore.keys(response.headers).forEach(function (header) {
          console.log('>>> ' + header + ': ' + response.headers[header])
        })
        console.log('>>>')
        console.log('>>> ' + body.split('\n').join('\n>>> '))
      }
      if (Math.floor(response.statusCode / 100) !== 2) {
        options.logger.error('_roundTrip error: HTTP response ' + response.statusCode)
        return callback(new Error('HTTP response ' + response.statusCode))
      }

      try {
        payload = (response.statusCode !== 204) ? JSON.parse(body) : null
      } catch (err) {
        return callback(err)
      }

      try {
        callback(null, response, payload)
      } catch (err0) {
        if (options.verboseP) console.log('callback: ' + err0.toString() + '\n' + err0.stack)
      }
    }).setEncoding('utf8')
  }).on('error', function (err) {
    callback(err)
  }).on('timeout', function () {
    timeoutP = true
    callback(new Error('timeout'))
  })
  if (params.payload) request.write(JSON.stringify(params.payload))
  request.end()

  if (!options.verboseP) return

  console.log('<<< ' + params.method + ' ' + params.protocol + '//' + params.hostname + params.path)
  underscore.keys(params.headers).forEach(function (header) { console.log('<<< ' + header + ': ' + params.headers[header]) })
  console.log('<<<')
  if (params.payload) console.log('<<< ' + JSON.stringify(params.payload, null, 2).split('\n').join('\n<<< '))
}
