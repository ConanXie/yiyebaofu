// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createPriceTag, reopenWebSocket } from './price';
import { EXTENSION_NAME } from './constants';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log(`Congratulations, your extension "${EXTENSION_NAME}" is now active!`);

  createPriceTag();

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const relaunch = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.relaunch`,
    () => {
      // The code you place here will be executed every time your command is executed

      reopenWebSocket();
    },
  );

  context.subscriptions.push(relaunch);

  // change config
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((_) => {
      reopenWebSocket();
    }),
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
