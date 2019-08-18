// SunShade (mrv)

var Service, Characteristic;
const fs = require('fs');

const writeFile = "/root/.homebridge/sunshade.txt";
const readFile = "/root/.homebridge/sunshaded.txt";

var battery = 100;
var position;
var manual = false;
var readtime;

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

    this.readData();
    
    this.targetPosition = this.currentPosition;
	this.positionState = Characteristic.PositionState.STOPPED;
	this.service.setCharacteristic(Characteristic.PositionState, this.positionState);
	this.service.getCharacteristic(Characteristic.TargetPosition).updateValue(this.targetPosition, null);
	this.service.getCharacteristic(Characteristic.CurrentPosition).updateValue(this.currentPosition, null);
   	
   	fs.watch(readFile, (event, filename) => {
   		if (event === 'change') this.readData();
   	});
}


SunShade.prototype.readData = function () {

	var data = fs.readFileSync(readFile, "utf-8");
	var lastSync = Date.parse(data.substring(0, 19));
	if (readtime == lastSync) return;
	readtime = lastSync;

	position = parseFloat(data.substring(20));
	
	if (isNaN(position)) return;
	
	var oldPosition = this.currentPosition;
	this.currentPosition = position ;
	this.service.setCharacteristic(Characteristic.CurrentPosition, this.currentPosition);
	this.service.getCharacteristic(Characteristic.CurrentPosition).updateValue(this.currentPosition, null);
	this.log("current position is now %s (target %s)", this.currentPosition, this.targetPosition);

	if (manual == true || this.positionState == Characteristic.PositionState.STOPPED) {
		manual = true;
	    this.targetPosition = this.currentPosition;
		this.service.getCharacteristic(Characteristic.TargetPosition).updateValue(this.targetPosition, null);
		if (this.currentPosition > oldPosition) {
			this.positionState = Characteristic.PositionState.INCREASING;
		} else if (this.currentPosition < oldPosition) {
			this.positionState = Characteristic.PositionState.DECREASING;
		}
		this.service.setCharacteristic(Characteristic.PositionState, this.positionState);
		this.service.getCharacteristic(Characteristic.PositionState).updateValue(this.positionState, null);
		this.service.getCharacteristic(Characteristic.CurrentPosition).updateValue(this.currentPosition, null);
	}
	
	if (manual == false) {
	    if (Math.abs(this.targetPosition - this.currentPosition) < 3) {
	    	this.targetPositiom = this.currentPosition;
			this.positionState = Characteristic.PositionState.STOPPED;
			this.service.setCharacteristic(Characteristic.PositionState, this.positionState);
			this.service.getCharacteristic(Characteristic.PositionState).updateValue(this.positionState, null);
			this.service.getCharacteristic(Characteristic.TargetPosition).updateValue(this.targetPosition, null);
			this.service.getCharacteristic(Characteristic.CurrentPosition).updateValue(this.currentPosition, null);
	    }
    } 
}; 


SunShade.prototype.identify = function(callback) {
	this.log("identify requested");
	return callback(null);
}


SunShade.prototype.getCurrentPosition = function(callback) {
	this.log("getCurrentPosition:", this.currentPosition);
	var error = null;
	callback(error, this.currentPosition);
}


SunShade.prototype.getName = function(callback) {
	this.log("getName:", this.name);
	var error = null;
	callback(error, this.name);
}


SunShade.prototype.getTargetPosition = function (callback) {	
    if (this.positionState == Characteristic.PositionState.STOPPED) {
    	this.targetPosition = this.currentPosition;
    }
	this.log("getTargetPosition:", this.targetPosition);
	var error = null;
	callback(error, this.targetPosition);
}


Number.prototype.pad = function(size) {
  var s = String(this);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
}


SunShade.prototype.setTargetPosition = function (value, callback) {
	if (this.targetPosition != value) {
		this.log("setTargetPosition from %s to %s", this.targetPosition, value);
		this.targetPosition = value;
		manual = false;
	
		if (this.targetPosition > this.currentPosition) {
			this.positionState = Characteristic.PositionState.INCREASING;
		} else if (this.targetPosition < this.currentPosition) {
			this.positionState = Characteristic.PositionState.DECREASING;
		} else if (this.targetPosition == this.currentPosition) {
			this.positionState = Characteristic.PositionState.STOPPED;
		}
		this.service.setCharacteristic(Characteristic.PositionState, this.positionState);
	
		pos = this.targetPosition.pad(3);
		fs.writeFileSync(writeFile, pos, "utf-8");
	}
	callback(null); // success
}


SunShade.prototype.getPositionState = function(callback) {
	this.log("getPositionState:", this.positionState);
	var error = null;
	callback(error, this.positionState);
}


SunShade.prototype.setUpServices = function() {

	this.informationService = new Service.AccessoryInformation();

	this.informationService
		.setCharacteristic(Characteristic.Name, this.name)
		.setCharacteristic(Characteristic.Manufacturer, "Thomas Nemec")
		.setCharacteristic(Characteristic.Model, "SunShade")
		.setCharacteristic(Characteristic.SerialNumber, this.sn);

    this.service = new Service.WindowCovering(this.name);

    // Required Characteristics
    //this.currentPosition = 100;
    //this.targetPosition = 100;

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
    
	this.service
		.getCharacteristic(Characteristic.Name)
		.on('get', this.getName.bind(this));

	// Required Characteristics
	this.service
		.getCharacteristic(Characteristic.CurrentPosition)
		.on('get', this.getCurrentPosition.bind(this));

		this.service
		.getCharacteristic(Characteristic.TargetPosition)
		.on('get', this.getTargetPosition.bind(this))
		.on('set', this.setTargetPosition.bind(this));

	this.service
		.getCharacteristic(Characteristic.PositionState)
		.on('get', this.getPositionState.bind(this));}


SunShade.prototype.getServices = function() {
	return [this.informationService, this.service];
}
