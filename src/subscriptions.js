const clear = require("clear");
const { spinner, waitForKey } = require('./utils');
const inquirer = require("inquirer");
const realmApp = require("./realmApp");
const output = require("./output");
const config = require("./config");

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// We keep our own copy of the subscriptions' definition to support the Refresh functionality
function getSavedSubscriptions() {
  const appId = config.getValue("appId")
  let appParams = config.getValue(appId);

  if (appParams == undefined) {
    appParams = { subscriptions: {} };
    config.setValue(appId, appParams);
  } else if (appParams.subscriptions == undefined) {
    appParams.subscriptions = {};
    config.setValue(appId, appParams);
  }

  return appParams.subscriptions;
}

function getSubscriptions(realm) {
  if (!realm.subscriptions.isEmpty) {
    let subscriptions = [];

    realm.subscriptions.forEach((value) => subscriptions.push({ Name: value.name, Table: value.objectType, Query: value.queryString }));

    return subscriptions;
  } else {
    return [];
  }
}

async function clearSubscriptions(realm) {
  if (!realm.subscriptions.isEmpty && realmApp.isAppConnected()) {
    realm.subscriptions.update((mutableSubs) => {
      mutableSubs.removeAll();
    }).catch((reason) => {
      output.error(reason);
    });

    await realm.subscriptions.waitForSynchronization();
  }
}

async function listSubscriptions() {
  const subscriptions = getSubscriptions(await realmApp.getRealm());

  output.table(subscriptions);

  await waitForKey();
}

async function applyInitialSubscriptions(realm) {
  if (realm.subscriptions.isEmpty) {
    const subscriptions = getSavedSubscriptions();
    const keys = Object.keys(subscriptions);

    if (!realmApp.isAppConnected()) {
      throw {message: "App is not connected to backend!"};
    }

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
          let query = subscriptions[element]["filter"];

          if (query.length > 2) {
            mutableSubs.add(objects.filtered(query), { name: element });
          } else {
            mutableSubs.add(objects, { name: element });
          }
        });
      });
    }
  }
}

async function addModifySubscription() {
  const realm = await realmApp.getRealm()

  const input = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Please enter the subscription name:",
    },
    {
      type: "input",
      name: "collection",
      message: "Collection/Table Name:",
    },
    {
      type: "input",
      name: "query",
      message: "RQL Filter:",
    },
  ]);

  // Do nothing if parameters aren't long enough
  if ((input.name.length < 2) || (input.collection.length < 2)) { return; }

  try {
    const objects = realm.objects(input.collection);

    if (objects) {
      if (!realmApp.isAppConnected()) {
        throw {message: "App is not connected to backend!"};
      }

      spinner.text = `Adding/Modifying subscription ${input.name}…`;
      spinner.start();

      realm.subscriptions.update((mutableSubs) => {
        if (input.query.length > 2) {
          mutableSubs.add(objects.filtered(input.query), { name: input.name });
        } else {
          mutableSubs.add(objects, { name: input.name });
        }
      }).catch((reason) => {
        output.error(reason);
      });
  
      await realm.subscriptions.waitForSynchronization();
  
      const appId = config.getValue("appId")
      let appParams = config.getValue(appId);

      if (appParams.subscriptions == undefined) {
        appParams.subscriptions = {};
      }
      appParams.subscriptions[input.name] = { class: input.collection, filter: input.query };

      config.setValue(appId, appParams);

      spinner.succeed("Subscriptions updated!");
    } else {
      output.error(`Class ${input.class} doesn't exist!`);
    }
  } catch (err) {
    output.error(err.message);
  }

  await sleep(1000);
  spinner.clear();
}

async function removeSubscription() {
  const realm = await realmApp.getRealm()
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
    default:
      try {
        if (!realmApp.isAppConnected()) {
          throw {message: "App is not connected to backend!"};
        }

        spinner.text = `Removing subscription ${choice.remove}…`;
        spinner.start();

        realm.subscriptions.update((mutableSubs) => {
          mutableSubs.removeByName(choice.remove);
        }).catch((reason) => {
          output.error(reason);
        });
    
        await realm.subscriptions.waitForSynchronization();
    
        const appId = config.getValue("appId")
        let appParams = config.getValue(appId);

        delete appParams.subscriptions[choice.remove];

        config.setValue(appId, appParams);

        spinner.succeed("Subscription removed!");
      } catch (err) {
        output.error(err.message);
      }

      spinner.clear();
      await sleep(1000);
  }
}

async function refreshSubscriptions() {
  const realm = await realmApp.getRealm();

  if (realm) {
    try {
      if (!realmApp.isAppConnected()) {
        throw {message: "App is not connected to backend!"};
      }
  
      spinner.text = "Clearing subscriptions…";
      spinner.start();
      
      await clearSubscriptions(realm);
      spinner.text = "Applying subscriptions…";
      await applyInitialSubscriptions(realm);

      spinner.succeed("Subscriptions refreshed!");
    } catch (err) {
      output.error(err.message);
    }

    await sleep(1000);
    spinner.clear();
  }
}

exports.listSubscriptions = listSubscriptions;
exports.applyInitialSubscriptions = applyInitialSubscriptions;
exports.addModifySubscription = addModifySubscription;
exports.removeSubscription = removeSubscription;
exports.refreshSubscriptions = refreshSubscriptions;
