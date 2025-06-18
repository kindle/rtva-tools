/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import AnsiToHtml from 'ansi-to-html';
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
    
    // register build button to reload mytasks.json to side bar
    _context.subscriptions.push(
        vscode.commands.registerCommand('rtva.build', async () => {
            try {
                await vscode.commands.executeCommand('workbench.action.tasks.build');
            } catch (err) {
                vscode.window.showWarningMessage('Failed to build: ' + err);
            }
        })
    );

    // register settings button to open mytasks.json
	_context.subscriptions.push(
        vscode.commands.registerCommand('rtva.config', async () => {
            const folders = vscode.workspace.workspaceFolders;
            if (!folders || folders.length === 0) {
                vscode.window.showWarningMessage('No workspace folder found.');
                return;
            }
            const workspaceRoot = folders[0].uri.fsPath;
            const tasksJsonPath = path.join(workspaceRoot, '.vscode', 'mytasks.json');
            const defaultTasksPath = _context.asAbsolutePath('config/mytasks-default.json');

            if (!fs.existsSync(tasksJsonPath)) {
                const answer = await vscode.window.showInformationMessage(
                    "'mytasks.json' does not exist. Load default 'mytasks.json'?",
                    'Yes', 'No'
                );
                if (answer === 'Yes') {
                    try {
                        if (!fs.existsSync(path.join(workspaceRoot, '.vscode'))) {
                            fs.mkdirSync(path.join(workspaceRoot, '.vscode'));
                        }
                        const defaultContent = fs.readFileSync(defaultTasksPath, 'utf8');
                        fs.writeFileSync(tasksJsonPath, defaultContent, 'utf8');
                        vscode.window.showInformationMessage('Default mytasks.json loaded.');
                    } catch (err) {
                        vscode.window.showErrorMessage('Failed to load default mytasks.json: ' + err);
                        return;
                    }
                } else {
                    return;
                }
            }
            const tasksJsonUri = vscode.Uri.file(tasksJsonPath);
            await vscode.commands.executeCommand('vscode.open', tasksJsonUri);
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
                const panel = vscode.window.createWebviewPanel(
                    'rtvaCheckOutput',
                    task.label,
                    vscode.ViewColumn.Active,
                    { enableScripts: true }
                );

                // Initial HTML with a script to receive messages
                if (task.asci===true){
                    panel.webview.html = `
                        <html style="height:100%">
                        <body style="height:100%">
                            <pre id="output" style="height: 100%;overflow-y:auto;"></pre>
                            <script>
                                const vscode = acquireVsCodeApi();
                                window.addEventListener('message', event => {
                                    const msg = event.data;
                                    if (msg.append) {
                                        document.getElementById('output').innerHTML += msg.append;
                                        document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
                                    }
                                    if (msg.done) {
                                        document.getElementById('output').innerHTML += "\\n[Process finished]";
                                        document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
                                    }
                                });
                            </script>
                        </body>
                        </html>
                    `;
                }
                else{
                    panel.webview.html = `
                        <html style="height:100%">
                        <body style="height:100%">
                            <pre id="output" style="height: 100%;overflow-y:auto;"></pre>
                            <script>
                                const vscode = acquireVsCodeApi();
                                window.addEventListener('message', event => {
                                    const msg = event.data;
                                    if (msg.append) {
                                        document.getElementById('output').textContent += msg.append;
                                        document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
                                    }
                                    if (msg.done) {
                                        document.getElementById('output').textContent += "\\n[Process finished]";
                                        document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
                                    }
                                });
                            </script>
                        </body>
                        </html>
                    `;
                }
                panel.webview.html = `
                    <html style="height:100%">
                    <body style="height:100%">
                        <pre id="output" style="height: 100%;overflow-y:auto;"></pre>
                        <script>
                            const vscode = acquireVsCodeApi();
                            window.addEventListener('message', event => {
                                const msg = event.data;
                                if (msg.append) {
                                    document.getElementById('output').innerHTML += msg.append;
                                    document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
                                }
                                if (msg.done) {
                                    document.getElementById('output').innerHTML += "\\n[Process finished]";
                                    document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
                                }
                            });
                        </script>
                    </body>
                    </html>
                `;

                // Spawn the process
                const proc = cp.spawn(task.command, { shell: true });

                proc.stdout.on('data', (data) => {
                    if (task.asci===true){
                        const ansiConvert = new AnsiToHtml();
                        const html = ansiConvert.toHtml(data.toString());
                        panel.webview.postMessage({ append: html });
                    }else{
                        panel.webview.postMessage({ append: data.toString() });
                    }
                    
                });
                proc.stderr.on('data', (data) => {
                    if (task.asci===true){
                        const ansiConvert = new AnsiToHtml();
                        const html = ansiConvert.toHtml(data.toString());
                        panel.webview.postMessage({ append: html });
                    }else{
                        panel.webview.postMessage({ append: data.toString() });
                    }
                });
                proc.on('close', () => {
                    panel.webview.postMessage({ done: true });
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