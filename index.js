var Accessory, Service, Characteristic, UUIDGen;
const request = require("request-promise-native")
const OpenSprinklerApiModule = require("./lib/opensprinkler_api.js")
const DevicesModule = require("./lib/devices.js")
const SystemModule = require("./lib/system.js")
const PromiseFinally = require('promise.prototype.finally')

PromiseFinally.shim()

const PLATFORM_NAME = "OpenSprinkler";
const PLUGIN_NAME = 'homebridge-opensprinkler-system';

module.exports = function (homebridge) {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  class SprinklerPlatform {
    constructor(log, config, api) {
      this.name = PLATFORM_NAME
      this.log = log;
      this.api = api;

      config.pollIntervalMs = config.pollIntervalMs || 5000
      config.defaultDurationSecs = config.defaultDurationSecs || 600

      if (!config.host) {
        throw("Host must be specified in the configuration!")
      }
      if (!config.password) {
        throw("Password must be specified in the configuration!")
      }

      let OpenSprinklerApi = OpenSprinklerApiModule(config, log)
      let openSprinklerApi = new OpenSprinklerApi()
      let Devices = DevicesModule(config, log, openSprinklerApi, Service, Characteristic)
      let System = SystemModule(config, log, openSprinklerApi, Devices)
      this.systemPromise = System.connect()
    }

    /**
     * Homebridge calls this because it's a static plugin to retrieve all of the accessories that this plugin exposes
     * @param next The callback handler to pass the list of AccessoryPlugin items back
     */
    accessories(next) {
      this.systemPromise.then(
        (system) => next(system.getAccessories()),
        (error) => {
          this.log(error)
          throw(error)
        }
      )
    }
  }

  homebridge.registerPlatform(PLATFORM_NAME, SprinklerPlatform);

};
