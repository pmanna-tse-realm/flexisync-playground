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

  Realm.setLogLevel("debug");
  Realm.setLogger((level, message) => logToFile(`(${level}) ${message}`));

  app = new Realm.App(appConfig);

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
      msg = `Error: ${error.message}${error.isFatal ? " Exiting…" : ""}`;

      logToFile(`Error dump: ${JSON.stringify(error)}`);
      output.error(msg);
 
      if (error.isFatal) {
        setTimeout(() => { process.exit(error.code) }, 1000);
      }
      break;
  }
}

async function openRealm() {
  const config = {
    sync: {
      user: app.currentUser,
      flexible: true,
      clientReset: {
        mode: "discardUnsyncedChanges",
        // These callbacks do nothing here, but can be used to react to a Client Reset when in .discardLocal mode
        onBefore: (before) => {
          logToFile(`Before a Client Reset for ${before.path})`);
        },
        onAfter: (before, after) => {
          logToFile(`After a Client Reset for ${before.path} => ${after.path})`);
        }
      },
      newRealmFileBehavior: { type: 'downloadBeforeOpen', timeOutBehavior: 'throwException' },
      existingRealmFileBehavior: { type: 'openImmediately', timeOutBehavior: 'openLocalRealm' },
      onError: errorSync
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

function connectionState(newState, oldState) {
  logToFile(`Connection: ${oldState} => ${newState}`);
}

async function getRealm() {
  if (realm == undefined) {
    spinner.text = 'Opening realm…';
    spinner.start();

    return openRealm()
      .then(aRealm => {
        realm = aRealm;
        // Progress notifications don't apply to Flexible Sync yet
        // aRealm.syncSession.addProgressNotification('download', 'reportIndefinitely', transferProgress);
        aRealm.syncSession.addConnectionNotification(connectionState);
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

function isAppConnected() {
  if (realm == undefined) {
    return false;
  }
  return realm.syncSession.connectionState != "disconnected";
}

function closeRealm() {
  if (realm != undefined) {
    // realm.syncSession.removeProgressNotification(transferProgress);
    realm.syncSession.removeConnectionNotification(connectionState);
    realm.close();
    realm = undefined;
  }
}

exports.getApp = getApp;
exports.setupApp = setupApp;
exports.getRealm = getRealm;
exports.isAppConnected = isAppConnected;
exports.closeRealm = closeRealm;
