// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createPriceTag, reopenWebSocket, updateCurrencyConfig } from './price';
import { EXTENSION_NAME } from './constants';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log(`Congratulations, your extension "${EXTENSION_NAME}" is now active!`);

  createPriceTag(context);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const onRelaunch = vscode.commands.registerCommand(`${EXTENSION_NAME}.relaunch`, () => {
    reopenWebSocket(context);
  });

  const onConfigChange = vscode.workspace.onDidChangeConfiguration((_) => {
    reopenWebSocket(context);
  });

  const onUpdateCurrencyConfig = vscode.commands.registerCommand(`${EXTENSION_NAME}.updateCurrency`, () => {
    updateCurrencyConfig(context);
  });

  context.subscriptions.push(onRelaunch, onConfigChange, onUpdateCurrencyConfig);
}

// this method is called when your extension is deactivated
export function deactivate() {}
