const { waitForKey } = require('./utils');
const { getRealm } = require("./realmApp");
const output = require("./output");
const inquirer = require("inquirer");

function queryClasses(realm) {
  const realm_schema = realm.schema;

  var classes = [];

  for (const objSchema of realm_schema.sort((a, b) => a['name'] < b['name'])) {
    classes.push(objSchema);
  }

  return classes;
}

function trackClass(realm, className) {
  let objects = realm.objects(className);

  output.watchResult(`${className}`, `${objects.length} objects`);
}

async function showTableContent(realm, className) {
  // Get all objects for that class, and print them, with an upper limit of 10
  const objects = realm.objects(className);
  const count = objects.length < 10 ? objects.length : 10;
  let index = 0;
  let fields = [];
  let samples = [];

  for (let object of objects) {
    if (index == 0) {
      // At the beginning, fetch the internal schema of the object
      let schema = object.objectSchema();

      fields = Object.keys(schema.properties);
    }

    let objDesc = {};

    // Build a readable sample of the object
    fields.forEach(field => {
      const value = object[field];
      const type = typeof value;

      // Showing non-basic types is confusing, so we filter for common readable types + _id
      switch (type) {
        case 'object':
          if (field == '_id') { objDesc[field] = value.toHexString(); }
          break;
        case 'string':
          if (value.length <= 30) {
            objDesc[field] = value;
          } else {
            objDesc[field] = value.substring(0, 29) + '…';
          }
          break;
        case 'number':
          objDesc[field] = value;
          break;
        default:
          break;
      }
    });

    samples.push(objDesc);

    index += 1;

    if (index >= count) {
      break;
    }
  }

  output.table(samples);

  await waitForKey();
}

async function showContent() {
  let realm = await getRealm();

  if (realm == undefined) { return; }

  let synchedClasses = queryClasses(realm);
  let classNames = [];

  for (const objSchema of synchedClasses) {
    if (!objSchema['embedded']) {
      classNames.push(objSchema['name']);
    }
  }

  classNames.forEach(name => {
    trackClass(realm, name);
  });


  let choice = await inquirer.prompt([
    {
      type: "rawlist",
      name: "select",
      message: "Choose a table to get a sample from:",
      choices: [...classNames, new inquirer.Separator(), "Back"],
      pageSize: 16
    },
  ]);

  switch (choice.select) {
    case 'Back':
      return;
    default:
      await showTableContent(realm, choice.select);
      break;
  }
}

exports.showContent = showContent;
