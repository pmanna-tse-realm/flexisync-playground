const inquirer = require("inquirer");
const clear = require("clear");
const user = require("../src/users");
const content = require("./content");
const subscriptions = require("./subscriptions");
const output = require("./output");
const { waitForKey } = require("./utils");

async function mainMenu() {
  while (true) {
    try {
      const Choices = {
        ShowContent: "Show current Realm content",
        CustomData: "Show User Custom Data",
        ListSubs: "List current subscriptions",
        AddSub: "Add/Modify a subscription",
        DelSub: "Delete a subscription",
        RefreshSub: "Refresh subscriptions",
      };

      clear();

      const answers = await inquirer.prompt({
        type: "rawlist",
        name: "mainMenu",
        message: "What would you like to do?",
        choices: [...Object.values(Choices), "Back", new inquirer.Separator()],
        pageSize: 16
      });

      switch (answers.mainMenu) {
        case Choices.ShowContent:
          await content.showContent();
          break;
        case Choices.CustomData:
          await user.showCustomDataOptions();
          await waitForKey();
          break;
        case Choices.ListSubs:
          await subscriptions.listSubscriptions();
          break;
        case Choices.AddSub:
          await subscriptions.addModifySubscription();
          break;
        case Choices.DelSub:
          await subscriptions.removeSubscription();
          break;
        case Choices.RefreshSub:
          await subscriptions.refreshSubscriptions();
          break;
        case "Back":
          return;
        default:
          break;
      }
    } catch (err) {
      output.error(err.message);
      return;
    }
  }
}

exports.mainMenu = mainMenu;
