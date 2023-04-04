#!/usr/bin/env node

const inquirer = require("inquirer");
const clear = require("clear");
const realmApp = require("./src/realmApp");
const users = require("./src/users");
const config = require("./src/config");
const output = require("./src/output");

async function login() {
  while (true) {
    clear();

    let Choices = {};

    if (users.getAuthedUser()) {
      Choices.LogInCurrent = "Login with current user";
    }

    Choices.LogInUser = "Log in with email/password";
    Choices.RegisterUser = "Register as a new email/password user";
    Choices.LogInAPI = "Login with an API Key";
    Choices.LogInAnon = "Login anonymously";

    if (users.getAuthedUser()) {
      Choices.LogOut = "Log out";
    }

    Choices.Quit = "Quit";

    output.header(
      "Please log in to your Realm account or register as a new user."
    );

    let choice = await inquirer.prompt([
      {
        type: "rawlist",
        name: "start",
        message: "What do you want to do?",
        choices: [...Object.values(Choices), new inquirer.Separator()],
        pageSize: 16
      },
    ]);

    switch (choice.start) {
      case Choices.LogInCurrent:
        await users.logInCurrent();
        break;
      case Choices.LogInUser:
        await users.logIn();
        break;
      case Choices.RegisterUser:
        await users.registerUser();
        break;
      case Choices.LogInAPI:
        await users.logInKey();
        break;
      case Choices.LogInAnon:
        await users.anonymous();
        break;
      case Choices.LogOut:
        await users.logOut();
        break;
      case Choices.Quit: {
        realmApp.closeRealm();

        process.exit(0);
      }
      default:
        break;
    }
  }
}

async function run() {
  let appId = config.getValue("appId");

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

    realmApp.setupApp(appId);

    await login();
  } catch (error) {
    throw (error);
  }
}

run().catch((err) => {
  output.error(err.message);
});

exports.run = run;
