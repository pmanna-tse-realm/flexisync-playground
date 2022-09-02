const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");

module.exports.intro = function (text) {
  clear();
  console.log(
    chalk.blueBright.bold(
      figlet.textSync(text, {
        font: "Computer",
      })
    )
  );
};

module.exports.header = function (text) {
  console.log(chalk.yellowBright.bold("\n" + text + "\n"));
};

module.exports.error = function (text) {
  console.log(chalk.red.bold("\n ❗\n" + text + "\n ❗\n"));
};

module.exports.result = function (text) {
  console.log(chalk.yellowBright(text + "\n"));
};

module.exports.watchResult = function (header, text) {
  console.log(
    chalk.bgCyan.black("\n---------------" + header + "----------------\n")
  );
  console.log(chalk.cyanBright(text + "\n"));
};

module.exports.table = function (object, properties) {
  console.log('\n');

  if ((Array.isArray(object)) && (object.length > 0)) {
    console.table(object, properties);
  } else {
    console.log(chalk.bgGreen.black("     List is empty     \n"));
  }
}