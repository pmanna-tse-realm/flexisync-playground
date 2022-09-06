const ora = require('ora');
const { prompt } = require("inquirer");

let spinner = ora("Working…");

async function waitForKey() {
    return prompt([
      {
        type: "input",
        name: "dummy",
        message: "Press Enter to proceed…",
      }
    ]);
  }

  exports.spinner = spinner;
  exports.waitForKey = waitForKey;
    