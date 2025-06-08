"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const vscode = require("vscode");
//if vscode is not found, try:
//npm install --save-dev vscode @types/vscode
//but ususally company laptop can not do this.
//vs code predefined icons:
//https://microsoft.github.io/vscode-codicons/dist/codicon.html
let rakeTaskProvider;
let customTaskProvider;
function activate(_context) {
    const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    if (!workspaceRoot) {
        return;
    }
    const treeDataProvider = new SimpleTreeDataProvider();
    vscode.window.createTreeView('rtvaView', { treeDataProvider });
    _context.subscriptions.push(vscode.commands.registerCommand('rtva.gear', async () => {
        // Open tasks.json in the .vscode folder of the workspace
        const folders = vscode.workspace.workspaceFolders;
        if (folders && folders.length > 0) {
            const tasksJson = vscode.Uri.joinPath(folders[0].uri, '.vscode', 'tasks.json');
            await vscode.commands.executeCommand('vscode.open', tasksJson);
        }
        else {
            vscode.window.showWarningMessage('No workspace folder found.');
        }
    }));
    _context.subscriptions.push(vscode.commands.registerCommand('rtva.build', async () => {
        // Run the default build task
        try {
            await vscode.commands.executeCommand('workbench.action.tasks.build');
        }
        catch (err) {
            vscode.window.showWarningMessage('Failed to run build task: ' + err);
        }
    }));
}
class SimpleTreeDataProvider {
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        return [new vscode.TreeItem('Welcome to RTVA!')];
    }
}
function deactivate() {
    if (rakeTaskProvider) {
        rakeTaskProvider.dispose();
    }
    if (customTaskProvider) {
        customTaskProvider.dispose();
    }
}
//# sourceMappingURL=extension.js.map