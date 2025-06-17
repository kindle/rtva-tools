/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
//if vscode is not found, try:
//npm install --save-dev vscode @types/vscode
//but ususally company laptop can not do this.

//vs code predefined icons:
//https://microsoft.github.io/vscode-codicons/dist/codicon.html

// terminal logger
let rtvaTerminal: vscode.Terminal | undefined;
function log(message: string) {
    if (!rtvaTerminal) {
        rtvaTerminal = vscode.window.createTerminal('rtva tools Logger');
    }
    rtvaTerminal.show(true);
    rtvaTerminal.sendText(`echo "${message.replace(/"/g, '\\"')}"`);
    vscode.window.showInformationMessage(message);
}

let rakeTaskProvider: vscode.Disposable | undefined;
let customTaskProvider: vscode.Disposable | undefined;

export function activate(_context: vscode.ExtensionContext): void {
	
    log('start extension...');
    const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
	if (!workspaceRoot) {
		return;
	}

    log('load actions...');
    const treeDataProvider = new SimpleTreeDataProvider();
    vscode.window.createTreeView('rtvaView', { treeDataProvider });

    log('register commands...');
    /*
    // register build button to reload mytasks.json to side bar
    _context.subscriptions.push(
        vscode.commands.registerCommand('rtva.reload', async () => {
            try {
                //await vscode.commands.executeCommand('workbench.action.tasks.build');
                //reload mytasks.json to side bar
                vscode.window.showInformationMessage('reloading mytasks.json...');
                treeDataProvider.refresh(); // Reload tasks
            } catch (err) {
                vscode.window.showWarningMessage('Failed to reload mytasks.json: ' + err);
            }
        })
    );
    */

    // register settings button to open mytasks.json
	_context.subscriptions.push(
        vscode.commands.registerCommand('rtva.config', async () => {
            const folders = vscode.workspace.workspaceFolders;
            if (folders && folders.length > 0) {
                const tasksJson = vscode.Uri.joinPath(folders[0].uri, '.vscode', 'mytasks.json');
                await vscode.commands.executeCommand('vscode.open', tasksJson);
            } else {
                vscode.window.showWarningMessage('No workspace folder found.');
            }
        })
    );

    // register run task command
    _context.subscriptions.push(
        vscode.commands.registerCommand('rtva.runTask', (idx: number) => {
            const folders = vscode.workspace.workspaceFolders;
            if (!folders || folders.length === 0) {return;}
            const mytasksPath = path.join(folders[0].uri.fsPath, '.vscode', 'mytasks.json');
            try {
                const data = fs.readFileSync(mytasksPath, 'utf8');
                const json = JSON.parse(data);
                const tasks = json.tasks || [];
                const task = tasks[idx];
                if (!task) {return;}
                cp.exec(task.command, (error, stdout, stderr) => {
                    const output = error ? (stderr || error.message) : stdout;
                    const panel = vscode.window.createWebviewPanel(
                        'rtvaCheckOutput',
                        task.label,
                        vscode.ViewColumn.Active,
                        {}
                    );
                    
                    panel.webview.html = `<pre>${output}</pre>`;
                });
            } catch (err) {
                vscode.window.showWarningMessage('Run task failed: ' + err);
            }
        })
    );

}

class SimpleTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private tasks: { label: string; command: string; icon: string; }[] = [];
    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor() {
        this.loadTasks();
        const folders = vscode.workspace.workspaceFolders;
        if (folders && folders.length > 0) {
            const pattern = new vscode.RelativePattern(folders[0], '.vscode/mytasks.json');
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);
            watcher.onDidChange(() => this.refresh());
            watcher.onDidCreate(() => this.refresh());
            watcher.onDidDelete(() => this.refresh());
        }
    }
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }
    refresh() {
        this.loadTasks();
        this._onDidChangeTreeData.fire();
    }
    private loadTasks() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {return;}
        const mytasksPath = path.join(folders[0].uri.fsPath, '.vscode', 'mytasks.json');
        try {
            const data = fs.readFileSync(mytasksPath, 'utf8');
            const json = JSON.parse(data);
            this.tasks = json.tasks || [];
        } catch {
            this.tasks = [];
        }
        log(this.tasks.length + ' tasks loaded from mytasks.json');
    }
    getChildren(): vscode.ProviderResult<vscode.TreeItem[]> {
        
        const taskItems = this.tasks.map((task, idx) => {
            const item = new vscode.TreeItem(task.label);
            item.command = {
                command: 'rtva.runTask',
                title: 'Run Task',
                arguments: [idx]
            };
            item.iconPath = new vscode.ThemeIcon(task.icon);
            return item;
        });
        return [ ...taskItems];
    }
}

export function deactivate(): void {
	if (rakeTaskProvider) {
		rakeTaskProvider.dispose();
	}
	if (customTaskProvider) {
		customTaskProvider.dispose();
	}
}