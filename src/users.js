const inquirer = require("inquirer");
const Realm = require("realm");
const { waitForKey } = require('./utils');
const { getApp, closeRealm } = require("./realmApp");
const { mainMenu } = require("./main");
const output = require("./output");

async function anonymous() {
  try {
    const app = getApp();
    const credentials = Realm.Credentials.anonymous();

    const user = await app.logIn(credentials);
    if (user) {
      output.result("You have successfully logged in as " + app.currentUser.id);
      await mainMenu();
    } else {
      output.error("There was an error logging you in");
      await waitForKey();
      return;
    }
  } catch (err) {
    output.error(err.message);
    await waitForKey();
    return;
}
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
    await waitForKey();
    return;
  }

  try {
    const credentials = Realm.Credentials.emailPassword(
      input.email,
      input.password
    );

    const app = getApp();
    const user = await app.logIn(credentials);

    if (user) {
      output.result("You have successfully logged in as " + app.currentUser.id);
      await mainMenu();
    } else {
      output.error("There was an error logging you in");
      await waitForKey();
      return;
    }
  } catch (err) {
    output.error(err.message);
    await waitForKey();
    return;
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
    await waitForKey();
    return;
  }

  const app = getApp();
    
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
      await mainMenu();
    } else {
      output.error("There was an error registering the new user account.");
      await waitForKey();
      return;
    }
  } catch (err) {
    output.error(err.message);
    await waitForKey();
    return;
  }
}

async function logInCurrent() {
  await mainMenu();
}

async function logOut() {
  const app = getApp();
  const user = app.currentUser;

  closeRealm();
  await user.logOut();

  return !user.isLoggedIn;
}

function getAuthedUser() {
  return getApp().currentUser;
}

exports.getAuthedUser = getAuthedUser;
exports.anonymous = anonymous;
exports.logIn = logIn;
exports.logInCurrent = logInCurrent;
exports.logOut = logOut;
exports.registerUser = registerUser;
