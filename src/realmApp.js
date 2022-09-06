const Realm = require("realm");
const { applyInitialSubscriptions } = require("./subscriptions");
const { spinner } = require("./utils");
const config = require("./config");
const output = require("./output");
const { logToFile } = require('./logger');

let realm;
let app;

function setupApp(appId) {
  const appConfig = {
    id: appId,
    timeout: 10000,
  };

  app = new Realm.App(appConfig);

  Realm.App.Sync.setLogLevel(app, "debug");
  Realm.App.Sync.setLogger(app, (level, message) => logToFile(`(${level}) ${message}`));

  config.setValue("appId", appId);
}

function getApp() {
  return app;
}

// General error handler: this will handle manual client reset,
// but is also needed if breaking changes are applied, as "discardLocal" won't be enough
function errorSync(session, error) {
  let msg = "";

  switch (error.name) {
    case 'ClientReset':
      if (realm != undefined) {
        const realmPath = realm.path;

        closeRealm();

        msg = `Error: ${error.message} Need to reset ${realmPath} and exit…`;

        Realm.App.Sync.initiateClientReset(app, realmPath);
      } else {
        msg = `Error: ${error.message} Exiting…`;
      }
      logToFile(msg);
      output.error(msg);

      // We can't rely on when this is called, to have a clean recover,
      // chances are that we're inside one of the `inquirer` promises, so we can't do much
      setTimeout(() => { process.exit(error.code) }, 1000);

      break;
    // Handle other cases…
    default:
      msg = `Error: ${error.message} Exiting…`;

      logToFile(msg);
      output.error(msg);

      setTimeout(() => { process.exit(error.code) }, 1000);
      break;
  }
}

async function openRealm() {
  const config = {
    sync: {
      user: app.currentUser,
      flexible: true,
      newRealmFileBehavior: { type: 'downloadBeforeOpen', timeOutBehavior: 'throwException' },
      existingRealmFileBehavior: { type: 'openImmediately', timeOutBehavior: 'openLocalRealm' },
      error: errorSync
    },
  };

  return Realm.open(config);
}

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
  if (realm == undefined) {
    spinner.text = 'Opening realm…';
    spinner.start();

    return openRealm()
      .then(aRealm => {
        realm = aRealm;
        aRealm.syncSession.addProgressNotification('download', 'reportIndefinitely', transferProgress);
        spinner.text = 'Applying subscriptions…';

        return applyInitialSubscriptions(realm);
      })
      .then(() => {
        spinner.succeed('Opened realm!');
        return realm;
      })
      .catch(reason => {
        const msg = JSON.stringify(reason, null, 2);

        spinner.fail(msg);
        logToFile(`Error: ${msg}`);

        setTimeout(() => { process.exit(1) }, 1000);
      });
  } else {
    return new Promise((resolve, reject) => {
      resolve(realm);
    });
  }
}

function closeRealm() {
  if (realm != undefined) {
    realm.close();
    realm = undefined;
  }
}


exports.getApp = getApp;
exports.setupApp = setupApp;
exports.getRealm = getRealm;
exports.closeRealm = closeRealm;
