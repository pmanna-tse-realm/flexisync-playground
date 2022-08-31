const fs = require("fs");
const packageDetails = require('../package');

let stream;

function fileExistsSync(file) {
  try {
    fs.accessSync(file, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function createLogName() {
  let applicationName = process.env.npm_package_name ?? (packageDetails.name ?? "NodeApp");
  let progressive = 0;
  let date = new Date().toISOString().substring(0, 10);
  let logFile;

  do {
    progressive += 1;
    logFile = `./${applicationName}.${date}_${progressive}.log`
  } while (fileExistsSync(logFile));

  return logFile;
}

exports.logToFile = function logToFile(message) {
  if (!stream) {
    stream = fs.createWriteStream(createLogName(), { flags: 'a' });
  }

  let date = new Date();

  stream.write(`[${date.toISOString()}] - ${message}\n`);
}
