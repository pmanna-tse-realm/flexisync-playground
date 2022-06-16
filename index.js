#!/usr/bin/env node

const Realm = require("realm");
const inquirer = require("inquirer");
const clear = require("clear");
const main = require("./main");
const users = require("./users");
const config = require("./config");
const { applyInitialSubscriptions } = require("./subscriptions");
const output = require("./output");
const ora = require('ora');

let realm;
let spinner = ora("Working…");

async function openRealm(partitionKey) {
  const config = {
    // schema: [schemas.TaskSchema, schemas.UserSchema, schemas.ProjectSchema],
    sync: {
      user: users.getAuthedUser(),
      flexible: true
    },
  };
  return Realm.open(config);
}

async function login() {
  clear();

  output.header(
    "Please log in to your Realm account or register as a new user."
  );

  let Choices = {
    LogInUser: "Log in with email/password",
    RegisterUser: "Register as a new email/password user",
    LogInAPI: "Login with an API Key",
    LogInAnon: "Login anonymously"
  };

  if (users.getAuthedUser()) {
    Choices["LogInCurrent"] = "Login with current user";
  }

  let choice = await inquirer.prompt([
    {
      type: "rawlist",
      name: "start",
      message: "What do you want to do?",
      choices: [...Object.values(Choices), new inquirer.Separator()],
    },
  ]);

  switch (choice.start) {
    case Choices.LogInUser:
      users.logIn();
      break;
    case Choices.RegisterUser:
      users.registerUser();
      break;
    case Choices.LogInAnon:
      users.anonymous();
      break;
    case Choices.LogInCurrent:
      main.mainMenu();
      break;
    default:
      login();
      break;
  }
}

async function run() {
  let appId = await config.getValue("appId");

  output.intro("Flexible Sync");

  output.header("*** WELCOME ***");
  if (appId == undefined) {
    output.header("Input the ID of the app you want to test");
  } else {
    output.header(`Input the ID of the app you want to test (or Enter to use ${appId})`);
  }

  const input = await inquirer.prompt([
    {
      type: "input",
      name: "appId",
      message: "App ID:",
    }
  ]);

  try {
    if (input.appId.length > 0) {
      appId = input.appId;
    }

    users.setupApp(appId);

    await login();
  } catch (error) {
    output.error(error);
  }
}

run().catch((err) => {
  output.error(err.message);
});

async function getRealm() {
  try {
    if (realm == undefined) {
      spinner.text = 'Opening realm…';
      spinner.start();

      realm = await openRealm();

      spinner.text = 'Applying subscriptions…';

      await applyInitialSubscriptions(realm);

      spinner.succeed('Opened realm!');
    }
  } catch (error) {
    spinner.fail(`${JSON.stringify(error, null, 2)}`);
  }
  return realm;
}

async function closeRealm() {
  if (realm != undefined) {
    realm.close();
    realm = undefined;
  }
}

exports.spinner = spinner;
exports.login = login;
exports.getRealm = getRealm;
exports.closeRealm = closeRealm;
exports.run = run;
