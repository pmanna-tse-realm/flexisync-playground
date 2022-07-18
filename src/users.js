const inquirer = require("inquirer");
const Realm = require("realm");
const index = require("../index");
const config = require("./config");
const main = require("./main");
const output = require("./output");
const { logToFile } = require('./logger');

let app;

function setupApp(appId) {
  const appConfig = {
    id: appId,
    timeout: 10000,
  };

  app = new Realm.App(appConfig);

  Realm.App.Sync.setLogLevel(app, "error");
  Realm.App.Sync.setLogger(app, (level, message) => logToFile(`(${level}) ${message}`));

  config.setValue("appId", appId);
}

function getApp() {
  return app;
}

async function anonymous() {
  try {
    const credentials = Realm.Credentials.anonymous();

    const user = await app.logIn(credentials);
    if (user) {
      output.result("You have successfully logged in as " + app.currentUser.id);
      return main.mainMenu();
    } else {
      output.error("There was an error logging you in");
      logOut();
    }
  } catch (err) {
    output.error(err.message);
  }
  process.exit(0);
}

async function logIn() {
  const input = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message: "Email:",
    },
    {
      type: "password",
      name: "password",
      message: "Password:",
      mask: "*",
    },
  ]);

  if ((input.email.length < 5) || (input.password.length < 3)) {
    output.error("Invalid user/password");
    await main.waitForKey();
    index.login();
    return;
  }

  try {
    const credentials = Realm.Credentials.emailPassword(
      input.email,
      input.password
    );

    const user = await app.logIn(credentials);
    if (user) {
      output.result("You have successfully logged in as " + app.currentUser.id);
      return main.mainMenu();
    } else {
      output.error("There was an error logging you in");
      return logIn();
    }
  } catch (err) {
    output.error(err.message);
    return logIn();
  }
}

async function registerUser() {
  output.header("WELCOME, NEW USER");
  const input = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message: "Email:",
    },
    {
      type: "password",
      name: "password",
      message: "Password:",
      mask: "*",
    },
  ]);

  if ((input.email.length < 5) || (input.password.length < 3)) {
    output.error("Invalid user/password");
    await main.waitForKey();
    index.login();
    return;
  }

  try {
    await app.emailPasswordAuth.registerUser({
      email: input.email,
      password: input.password,
    });
    const credentials = Realm.Credentials.emailPassword(
      input.email,
      input.password
    );
    const user = await app.logIn(credentials);
    if (user) {
      output.result(
        "You have successfully created a new Realm user and are now logged in."
      );
      return main.mainMenu();
    } else {
      output.error("There was an error registering the new user account.");
      return registerUser();
    }
  } catch (err) {
    output.error(err.message);
    return registerUser();
  }
}

async function logOut() {
  user = app.currentUser;
  await user.logOut();
  index.closeRealm();
  return !user.isLoggedIn;
}

function getAuthedUser() {
  return app.currentUser;
}

exports.getApp = getApp;
exports.setupApp = setupApp;
exports.getAuthedUser = getAuthedUser;
exports.anonymous = anonymous;
exports.logIn = logIn;
exports.logOut = logOut;
exports.registerUser = registerUser;
