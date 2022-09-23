# Flexible Sync Playground

## Abstract

MongoDB has introduced [Flexible Sync](https://www.mongodb.com/docs/atlas/app-services/sync/data-access-patterns/flexible-sync/) for Realm apps: this sample application has two main purposes

1. Show in code the basics of dealing with Flexible Sync
2. Prove that it's possible to write a completely agnostic app: the code doesn't know anything about the backend, everything is configured by asking the user the relevant information

The Node.js environment has been chosen as ideal, as it offers the best chances at full flexibility, because of the weak typing of JavaScript.

## Install

After checkout, fetch the external modules:

```
cd <script folder>
npm install
```

To install the utility so that it can be invoked from the command line in a terminal:

```sh
cd <script folder>
# makes index.js executable
chmod ugo+x index.js
npm install -g
```

## Usage

Run the main entry point:

```sh
npm run start
```

Or, if it was installed as a global command

```sh
flxsyncplay
```

The application will run through a series of textual menus, that should be self-explanatory.

#### Disclaimer

The source code provided here is published in good faith and for general information purpose only. The author(s) and MongoDB Technical Support don't make any warranties about the completeness, reliability and accuracy of this information. Any action you take upon the provided code, and its use in conjunction with other code and libraries, is strictly at your own risk. The author(s) and MongoDB Technical Support will not be liable for any losses and/or damages in connection with the use of this code.
