const Realm = require("realm");
const clear = require("clear");
const inquirer = require("inquirer");
const index = require("./index");
const main = require("./main");
const output = require("./output");
const config = require("./config");

function getSavedSubscriptions() {
  const appId = config.getValue("appId")
  let appParams = config.getValue(appId);

  if (appParams == undefined) {
    appParams = { subscriptions: {} };
    config.setValue(appId, appParams);
  }

  return appParams.subscriptions;
}

function getSubscriptions(realm) {
  if (!realm.subscriptions.isEmpty) {
    let subscriptions = [];

    realm.subscriptions.forEach((value, index, subscriptionSet) => subscriptions.push({ Name: value.name, Table: value.objectType, Query: value.queryString }));

    return subscriptions;
  } else {
    return [];
  }
}

async function listSubscriptions() {
  const subscriptions = getSubscriptions(await index.getRealm());

  output.table(subscriptions);

  await main.waitForKey();
}

async function clearSubscriptions(realm) {
  if (!realm.subscriptions.isEmpty) {
    await realm.subscriptions.update((mutableSubs) => {
      mutableSubs.removeAll();
    });
  }
}

async function applyInitialSubscriptions(realm) {
  if (realm.subscriptions.isEmpty) {
    const subscriptions = getSavedSubscriptions();
    const keys = Object.keys(subscriptions);

    if (keys.length > 0) {
      let cursors = {};

      keys.forEach(element => {
        let className = subscriptions[element]["class"];

        cursors[className] = realm.objects(className);
      });

      await realm.subscriptions.update((mutableSubs) => {
        keys.forEach(element => {
          let className = subscriptions[element]["class"];
          let objects = cursors[className];

          mutableSubs.add(objects.filtered(subscriptions[element]["filter"]), { name: element });
        });
      });
    }
  }

  await realm.subscriptions.waitForSynchronization();
}

async function refreshSubscriptions() {
  const realm = await index.getRealm();

  if (realm) {
    const spinner = index.spinner;

    spinner.text = "Clearing subscriptions…";
    spinner.start();
    await clearSubscriptions(realm);
    spinner.text = "Applying subscriptions…";
    await applyInitialSubscriptions(realm);

    spinner.succeed("Subscriptions refreshed!");
  }
}

async function removeSubscription() {
  const realm = await index.getRealm()
  const subscriptions = getSubscriptions(realm);

  clear();

  output.table(subscriptions);

  let names = subscriptions.map((value) => value.Name);

  let choice = await inquirer.prompt([
    {
      type: "rawlist",
      name: "remove",
      message: "Which subscription do you want to remove?",
      choices: [...names, new inquirer.Separator(), "Back"],
    },
  ]);

  switch (choice.remove) {
    case 'Back':
      return;
    default: {
      const spinner = index.spinner;

      spinner.text = `Removing subscription ${choice.remove}…`;
      spinner.start();

      await realm.subscriptions.update((mutableSubs) => {
        mutableSubs.removeByName(choice.remove);
      });

      spinner.text = "Refreshing subscriptions…";
      await realm.subscriptions.waitForSynchronization();

      const appId = config.getValue("appId")
      let appParams = config.getValue(appId);

      delete appParams.subscriptions[choice.remove];

      config.setValue(appId, appParams);

      spinner.succeed("Subscriptions refreshed!");
    }
  }
}

exports.listSubscriptions = listSubscriptions;
exports.applyInitialSubscriptions = applyInitialSubscriptions;
exports.refreshSubscriptions = refreshSubscriptions;
exports.removeSubscription = removeSubscription;
