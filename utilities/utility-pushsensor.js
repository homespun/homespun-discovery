/* jshint asi: true */

var underscore  = require('underscore')


var Service
  , Characteristic
  , CommunityTypes
  , UUIDGen


var init = function (homebridge) {
  Service        = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  CommunityTypes = require('hap-nodejs-community-types')(homebridge)
  UUIDGen        = homebridge.hap.uuid
}


var Sensor = function (platform, sensorId, service) {
  var accessory

  if (!(this instanceof Sensor)) return new Sensor(platform, sensorId, service)

  this.platform = platform
  this.log = this.platform.log
  this.sensorId = sensorId

  this.name = service.properties.name
  this.manufacturer = service.properties.manufacturer
  this.model = service.properties.model
  this.serialNumber = service.properties.serialNumber
  this.firmwareRevision = service.properties.firmwareRevision
  this.hardwareRevision = service.properties.hardwareRevision

  this.capabilities = service.capabilities  
  this.readings = {}

  this.uuid = UUIDGen.generate(sensorId)

  accessory = this.platform.discoveries[this.uuid]
  if (!accessory) return this.platform._addAccessory(this)

  delete this.platform.discoveries[this.uuid]
  this.attachAccessory(accessory)
  accessory.updateReachability(true)
}

Sensor.prototype.attachAccessory = function (accessory) {
  this.accessory = accessory
  this._setServices(accessory)
  this.log('attachAccessory',
           underscore.pick(this, [ 'uuid', 'name', 'manufacturer', 'model', 'serialNumber', 'firmwareRevision' ]))
}

Sensor.prototype._setServices = function (accessory) {
  var self = this

  var findOrCreateService = function (P, callback) {
    var newP
    var service = accessory.getService(P)

    if (!service) {
      newP = true
      service = new P()
    }
    callback(service)

    if (newP) accessory.addService(service, self.name)
  }

  findOrCreateService(Service.AccessoryInformation, function (service) {
    service.setCharacteristic(Characteristic.Name, self.name)
           .setCharacteristic(Characteristic.Manufacturer, self.manufacturer)
           .setCharacteristic(Characteristic.Model, self.model)
           .setCharacteristic(Characteristic.SerialNumber, self.serialNumber)
           .setCharacteristic(Characteristic.FirmwareRevision, self.firmwareRevision)
           .setCharacteristic(Characteristic.HardwareRevision, self.hardwareRevision)
  })

  underscore.keys(self.capabilities).forEach(function (key) {
    var f =
    { co:
        function () {
          findOrCreateService(Service.CarbonMonoxideSensor, function (service) {
            service.setCharacteristic(Characteristic.Name, self.name + ' Carbon Monoxide')
            service.getCharacteristic(Characteristic.CarbonMonoxideDetected)
                   .on('get', function (callback) { self._getState.bind(self)('co_detected', callback) })
            service.getCharacteristic(Characteristic.CarbonMonoxideLevel)
                   .on('get', function (callback) { self._getState.bind(self)('co', callback) })
           })
         }

    , co2:
        function () {
          findOrCreateService(Service.CarbonDioxideSensor, function (service) {
            service.setCharacteristic(Characteristic.Name, self.name + ' Carbon Dioxide')
            service.getCharacteristic(Characteristic.CarbonDioxideDetected)
                   .on('get', function (callback) { self._getState.bind(self)('co2_detected', callback) })
            service.getCharacteristic(Characteristic.CarbonDioxideLevel)
                   .on('get', function (callback) { self._getState.bind(self)('co2', callback) })
           })
         }

     , humidity:
        function () {
          findOrCreateService(Service.HumiditySensor, function (service) {
            service.setCharacteristic(Characteristic.Name, self.name + ' Humidity')
            service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
                   .on('get', function (callback) { self._getState.bind(self)('humidity', callback) })
           })
         }

     , light:
        function () {
          findOrCreateService(Service.LightSensor, function (service) {
            service.setCharacteristic(Characteristic.Name, self.name + ' Light')
            service.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
                   .on('get', function (callback) { self._getState.bind(self)('light', callback) })
           })
         }

    , no2:
        function () {
          findOrCreateService(CommunityTypes.NitrogenDioxideSensor, function (service) {
            service.setCharacteristic(Characteristic.Name, self.name + ' Nitrogen Dioxide')
            service.getCharacteristic(CommunityTypes.NitrogenDioxideDetected)
                   .on('get', function (callback) { self._getState.bind(self)('no2_detected', callback) })
            service.getCharacteristic(CommunityTypes.NitrogenDioxideLevel)
                   .on('get', function (callback) { self._getState.bind(self)('no2', callback) })
           })
         }

    , o3:
        function () {
          findOrCreateService(CommunityTypes.OzoneSensor, function (service) {
            service.setCharacteristic(Characteristic.Name, self.name + ' Ozone')
            service.getCharacteristic(CommunityTypes.OzoneDetected)
                   .on('get', function (callback) { self._getState.bind(self)('o3_detected', callback) })
            service.getCharacteristic(CommunityTypes.OzoneLevel)
                   .on('get', function (callback) { self._getState.bind(self)('o3', callback) })
           })
         }

     , 'particles.2_5':
        function () {
          findOrCreateService(Service.AirQualitySensor, function (service) {
            service.setCharacteristic(Characteristic.Name, self.name + ' Air Quality')
                   .setCharacteristic(Characteristic.AirParticulateSize, Characteristic.AirParticulateSize._2_5_M)
            service.getCharacteristic(Characteristic.AirQuality)
                   .on('get', function (callback) { self._getState.bind(self)('aqi', callback) })
            service.getCharacteristic(Characteristic.AirParticulateDensity)
                   .on('get', function (callback) { self._getState.bind(self)('particles.2_5', callback) })
          })
        }

    , so2:
        function () {
          findOrCreateService(CommunityTypes.SodiumDioxideSensor, function (service) {
            service.setCharacteristic(Characteristic.Name, self.name + ' Sodium Dioxide')
            service.getCharacteristic(CommunityTypes.SodiumDioxideDetected)
                   .on('get', function (callback) { self._getState.bind(self)('so2_detected', callback) })
            service.getCharacteristic(CommunityTypes.SodiumDioxideLevel)
                   .on('get', function (callback) { self._getState.bind(self)('so2', callback) })
           })
         }

     , pressure:
        function () {
          findOrCreateService(CommunityTypes.AtmosphericPressureSensor, function (service) {
            service.setCharacteristic(Characteristic.Name, self.name + ' Atmospheric Pressure')
            service.getCharacteristic(CommunityTypes.AtmosphericPressureLevel)
                   .on('get', function (callback) { self._getState.bind(self)('pressure', callback) })
           })
         }

    , temperature:
        function () {
          findOrCreateService(Service.TemperatureSensor, function (service) {
            service.setCharacteristic(Characteristic.Name, self.name + ' Temperature')
            service.getCharacteristic(Characteristic.CurrentTemperature)
                   .on('get', function (callback) { self._getState.bind(self)('temperature', callback) })
          })
        }

    , voc:
        function () {
          findOrCreateService(CommunityTypes.VolatileOrganicCompoundSensor, function (service) {
            service.setCharacteristic(Characteristic.Name, self.name + ' Sodium Dioxide')
            service.getCharacteristic(CommunityTypes.VolatileOrganicCompoundDetected)
                   .on('get', function (callback) { self._getState.bind(self)('voc_detected', callback) })
            service.getCharacteristic(CommunityTypes.VolatileOrganicCompoundLevel)
                   .on('get', function (callback) { self._getState.bind(self)('voc', callback) })
           })
         }
    }[key] || function () { self.platform.log.warn('setServices: no Service for ' + key) }
    f()
  })
}

Sensor.prototype._update = function (readings) {
  var self = this

  var accessory = self.accessory

  var setCharacteristic = function (P, Q, property) {
    var service = accessory.getService(P)

    if (!service) return self.platform.log.warn('update: no Service for ' + property)

    self._getState(property, function (err, value) {
      service.setCharacteristic(Q, value)
    })
  }

  underscore.keys(readings).forEach(function (key) {
    var f =
    { co:
        function () {
          setCharacteristic(Service.CarbonMonoxideSensor, Characteristic.CarbonMonoxideDetected, 'co_detected')
          setCharacteristic(Service.CarbonMonoxideSensor, Characteristic.CarbonMonoxideLevel, 'co')
        }

     , co2:
        function () {
          setCharacteristic(Service.CarbonDioxideSensor, Characteristic.CarbonDioxideDetected, 'co2_detected')
          setCharacteristic(Service.CarbonDioxideSensor, Characteristic.CarbonDioxideLevel, 'co2')
        }

     , humidity:
        function () {
          setCharacteristic(Service.HumiditySensor, Characteristic.CurrentRelativeHumidity, 'humidity')
        }

     , light:
        function () {
          setCharacteristic(Service.LightSensor, Characteristic.CurrentAmbientLightLevel, 'light')
        }

     , no2:
        function () {
          setCharacteristic(CommunityTypes.NitrogenDioxideSensor, CommunityTypes.NitrogenDioxideDetected, 'no2_detected')
          setCharacteristic(CommunityTypes.NitrogenDioxideSensor, CommunityTypes.NitrogenDioxideLevel, 'no2')
        }

     , o3:
        function () {
          setCharacteristic(CommunityTypes.OzoneSensor, CommunityTypes.OzoneDetected, 'o3_detected')
          setCharacteristic(CommunityTypes.OzoneSensor, CommunityTypes.OzoneLevel, 'o3')
        }

     , particulate:
        function () {
          setCharacteristic(Service.AirQualitySensor, Characteristic.AirQuality, 'aqi')
          setCharacteristic(Service.AirQualitySensor, Characteristic.AirParticulateDensity, 'particulate')
        }

     , pressure:
        function () {
          setCharacteristic(CommunityTypes.AtmosphericPressureSensor, CommunityTypes.AtmosphericPressureLevel, 'pressure')
        }

     , so2:
        function () {
          setCharacteristic(CommunityTypes.SodiumDioxideSensor, CommunityTypes.SodiumDioxideDetected, 'so2_detected')
          setCharacteristic(CommunityTypes.SodiumDioxideSensor, CommunityTypes.SodiumDioxideLevel, 'so2')
        }

    , temperature:
        function () {
          setCharacteristic(Service.TemperatureSensor, Characteristic.CurrentTemperature, 'temperature')
        }

     , voc:
        function () {
          setCharacteristic(CommunityTypes.VolatileOrganicCompoundSensor, CommunityTypes.VolatileOrganicCompoundDetected,
                            'voc_detected')
          setCharacteristic(CommunityTypes.VolatileOrganicCompoundSensor, CommunityTypes.VolatileOrganicCompoundLevel, 'voc')
        }
    }[key]
    if (f) f()
  })
}

Sensor.prototype._getState = function (property, callback) {
  var abnormal, capability, key, state, value

  switch (property) {
    case 'co_detected':
      key = 'co'
      abnormal = Characteristic.CarbonMonoxideDetected.CO_LEVELS_ABNORMAL
      state = Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL
      break

    case 'co2_detected':
      key = 'co2'
      abnormal = Characteristic.CarbonDioxideDetected.CO2_LEVELS_ABNORMAL
      state = Characteristic.CarbonDioxideDetected.CO2_LEVELS_NORMAL
      break

    case 'no2_detected':
      key = 'no2'
      abnormal = CommunityTypes.NitrogenDioxideDetected.NO2_LEVELS_ABNORMAL
      state = CommunityTypes.NitrogenDioxideDetected.NO2_LEVELS_NORMAL
      break

    case 'o3_detected':
      key = 'o3'
      abnormal = CommunityTypes.OzoneDetected.O3_LEVELS_ABNORMAL
      state = CommunityTypes.OzoneDetected.O3_LEVELS_NORMAL
      break

    case 'so2_detected':
      key = 'so2'
      abnormal = CommunityTypes.SodiumDioxideDetected.SO2_LEVELS_ABNORMAL
      state = CommunityTypes.SodiumDioxideDetected.SO2_LEVELS_NORMAL
      break

    case 'voc_detected':
      key = 'voc'
      abnormal = CommunityTypes.VolatileOrganicCompoundDetected.VOC_LEVELS_ABNORMAL
      state = CommunityTypes.VolatileOrganicCompoundDetected.VOC_LEVELS_NORMAL
      break

    default:
      return callback(null, this.readings[property])
  }
  capability = this.capabilities[key]
  value = this.readings[key]

  if (!capability.readings) return callback(null, state)
  
  capability.readings.forEach(function (reading) {
    if ((reading.category !== 'reading') || (!reading.condition) || (!reading.condition.operator)
          || (typeof reading.condition.value === 'undefined')) return

    switch (reading.condition.operator) {
      case '>':
        if (value > reading.value) state = abnormal
        break

      case '<':
        if (value < reading.value) state = abnormal
        break

      default:
        break
    }
  })

  callback(null, state)
}

module.exports =
{ init   : init
, Sensor : Sensor
}
