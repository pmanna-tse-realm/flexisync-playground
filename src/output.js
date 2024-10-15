const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");


function intro(text) {
  clear();
  console.log(
    chalk.blueBright.bold(
      figlet.textSync(text, {
        font: "Computer",
      }),
    ),
  );
}

function header(text) {
  console.log(chalk.yellowBright.bold("\n" + text + "\n"));
}

function error(text) {
  console.log(chalk.red.bold("\n ❗\n" + text + "\n ❗\n"));
}

function result(text) {
  console.log(chalk.yellowBright(text + "\n"));
}

function watchResult(header, text) {
  console.log(
    chalk.bgCyan.black("\n---------------" + header + "----------------\n"),
  );
  console.log(chalk.cyanBright(text + "\n"));
}

function table(object, properties) {
  console.log("\n");

  if (Array.isArray(object) && object.length > 0) {
    console.table(object, properties);
  } else {
    console.log(chalk.bgGreen.black("     List is empty     \n"));
  }
}

exports.intro = intro;
exports.header = header;
exports.error = error;
exports.result = result;
exports.watchResult = watchResult;
exports.table = table;
