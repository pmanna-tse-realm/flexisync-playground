#!/usr/bin/env node

const Realm = require("realm");
const inquirer = require("inquirer");
const clear = require("clear");
const main = require("./src/main");
const users = require("./src/users");
const config = require("./src/config");
const { applyInitialSubscriptions } = require("./src/subscriptions");
const output = require("./src/output");
const ora = require('ora');
const { logToFile } = require('./src/logger');

let realm;
let spinner = ora("Working…");

// General error handler: this will handle manual client reset,
// but is also needed if breaking changes are applied, as "discardLocal" won't be enough
function errorSync(session, error) {
  if (realm != undefined) {
    switch (error.name) {
      case 'ClientReset':
        const realmPath = realm.path;

        closeRealm();

        logToFile(`Error ${error.message}, need to reset ${realmPath}…`);
        Realm.App.Sync.initiateClientReset(users.getApp(), realmPath);
        break;
      // TODO: Handle other cases…
      default:
        logToFile(`Received error ${error.message}`);
    }
  }
}

async function openRealm() {
  const config = {
    sync: {
      user: users.getAuthedUser(),
      flexible: true,
      newRealmFileBehavior: { type: 'downloadBeforeOpen', timeOutBehavior: 'throwException' },
      existingRealmFileBehavior: { type: 'openImmediately', timeOutBehavior: 'openLocalRealm' },
      error: errorSync
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

function transferProgress(transferred, transferables) {
  if (transferables > 0) {
    if (transferred < transferables) {
      logToFile(`Transferred ${transferred} of ${transferables}`);
    } else {
      logToFile(`Transfer finished :  ${transferred} -> ${transferables}`);
    }
  }
}

async function getRealm() {
  try {
    if (realm == undefined) {
      spinner.text = 'Opening realm…';
      spinner.start();

      realm = await openRealm();

      realm.syncSession.addProgressNotification('download', 'reportIndefinitely', transferProgress);

      spinner.text = 'Applying subscriptions…';

      await applyInitialSubscriptions(realm);

      spinner.succeed('Opened realm!');
    }
  } catch (error) {
    spinner.fail(`${JSON.stringify(error, null, 2)}`);
  }
  return realm;
}

function closeRealm() {
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
