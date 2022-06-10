const inquirer = require("inquirer");
const clear = require("clear");
const users = require("./users");
const index = require("./index");
const content = require("./content");
const output = require("./output");

const Choices = {
  ShowContent: "Show current Realm content",
  ListSubs: "List current subscriptions",
  AddSub: "Add/Modify a subscription",
  DelSub: "Delete a subscription",
  LogOut: "Log out",
};

async function mainMenu() {
  try {
    clear();

    const answers = await inquirer.prompt({
      type: "rawlist",
      name: "mainMenu",
      message: "What would you like to do?",
      choices: [...Object.values(Choices), new inquirer.Separator()],
    });

    switch (answers.mainMenu) {
      case Choices.ShowContent: {
        await content.showContent();
        return mainMenu();
      }
      case Choices.ListSubs: {
        return mainMenu();
      }
      case Choices.AddSub: {
        return mainMenu();
      }
      case Choices.DelSub: {
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
      default: {
        return mainMenu();
      }
    }
  } catch (err) {
    output.error(err.message);
    return;
  }
}


exports.mainMenu = mainMenu;
