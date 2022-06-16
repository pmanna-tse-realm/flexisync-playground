const inquirer = require("inquirer");
const clear = require("clear");
const users = require("./users");
const index = require("./index");
const content = require("./content");
const subscriptions = require("./subscriptions");
const output = require("./output");

const Choices = {
  ShowContent: "Show current Realm content",
  ListSubs: "List current subscriptions",
  AddSub: "Add/Modify a subscription",
  DelSub: "Delete a subscription",
  RefreshSub: "Refresh subscriptions",
  LogOut: "Log out",
  Quit: "Quit",
};

async function waitForKey() {
  const input = await inquirer.prompt([
    {
      type: "input",
      name: "dummy",
      message: "Press Enter to proceed…",
    }
  ]);
}

async function mainMenu() {
  try {
    clear();

    const answers = await inquirer.prompt({
      type: "rawlist",
      name: "mainMenu",
      message: "What would you like to do?",
      choices: [...Object.values(Choices), new inquirer.Separator()],
      pageSize: 32
    });

    switch (answers.mainMenu) {
      case Choices.ShowContent: {
        await content.showContent();
        return mainMenu();
      }
      case Choices.ListSubs: {
        await subscriptions.listSubscriptions();
        return mainMenu();
      }
      case Choices.AddSub: {
        await subscriptions.addModifySubscription();
        return mainMenu();
      }
      case Choices.DelSub: {
        await subscriptions.removeSubscription();
        return mainMenu();
      }
      case Choices.RefreshSub: {
        await subscriptions.refreshSubscriptions();
        return mainMenu();
      }
      case Choices.LogOut: {
        const loggedOut = await users.logOut();
        if (!loggedOut) {
          output.error("Error logging out");
          process.exit(0);
        } else {
          output.result("You have been logged out.");
          index.login();
        }
        return;
      }
      case Choices.Quit: {
        await index.closeRealm();

        process.exit(0);
      }
      default: {
        return mainMenu();
      }
    }
  } catch (err) {
    output.error(err.message);
    return;
  }
}

exports.waitForKey = waitForKey;
exports.mainMenu = mainMenu;
