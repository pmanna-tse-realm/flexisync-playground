const fs = require('fs-extra');

const configFileName = "config.json";
let configuration;

function saveConfiguration() {
  try {
    fs.writeJSONSync(configFileName, configuration,{spaces: 2});
  } catch (e) {
    console.error(e);
  }
}

function openConfiguration() {
  try {
    configuration = fs.readJSONSync(configFileName, {})
  } catch (e) {
    configuration = {};
    console.error(e);
  }
}

function getValue(valueName) {
  if (configuration == undefined) {
    openConfiguration();
  }

  return configuration[valueName];
}

function setValue(valueName, value) {
  if (configuration == undefined) {
    openConfiguration();
  }

  try {
    configuration[valueName] = value;
    saveConfiguration();
  } catch (error) {
    console.error(error);
  }
}

exports.getValue = getValue;
exports.setValue = setValue;
