var Service, Characteristic;
const fs = require('fs');

var battery = 100;

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory("homebridge-sunshade", "SunShade", SunShade);
}

function SunShade(log, config) {

	this.log = log;

	this.name = config["name"];
	this.sn = config['sn'] || 'Unknown';
	
  this.setUpServices();
}


SunShade.prototype.getBatteryLevel = function (callback) {
    return callback(null, 100);
};


SunShade.prototype.getStatusLowBattery = function (callback) {
    return callback(null, battery >= 0.8 ? Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL : Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW);
};


SunShade.prototype.setUpServices = function() {

	this.informationService = new Service.AccessoryInformation();

	this.informationService
		.setCharacteristic(Characteristic.Name, this.name)
		.setCharacteristic(Characteristic.Manufacturer, "Thomas Nemec")
		.setCharacteristic(Characteristic.Model, "Stateless Switch")
		.setCharacteristic(Characteristic.SerialNumber, this.sn);

    this.batteryService = new Service.BatteryService(this.name);
    this.batteryService.getCharacteristic(Characteristic.BatteryLevel)
        .on('get', this.getBatteryLevel.bind(this));
    this.batteryService.setCharacteristic(Characteristic.ChargingState, Characteristic.ChargingState.NOT_CHARGEABLE);
    this.batteryService.getCharacteristic(Characteristic.StatusLowBattery)
        .on('get', this.getStatusLowBattery.bind(this));

    this.service = new Service.WindowCovering(this.name);

    // Required Characteristics
    this.currentPosition = 100;
    this.targetPosition = 100;

    //Characteristic.PositionState.DECREASING = 0;
    //Characteristic.PositionState.INCREASING = 1;
    //Characteristic.PositionState.STOPPED = 2;

    this.positionState = Characteristic.PositionState.STOPPED;
    this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);

    // Optional Characteristics
    //this.holdPosition = Characteristic.HoldPosition;
    //this.targetHorizontalTiltAngle = Characteristic.TargetHorizontalTiltAngle;
    //this.targetVerticalTiltAngle = Characteristic.TargetVerticalTiltAngle;
    //this.currentHorizontalTiltAngle = Characteristic.CurrentHorizontalTiltAngle;
    //this.currentVerticalTiltAngle = Characteristic.CurrentVerticalTiltAngle;
    //this.obstructionDetected = Characteristic.ObstructionDetected;
}


SunShade.prototype.getServices = function() {
	return [this.informationService, this.batteryService, this.service];
}
