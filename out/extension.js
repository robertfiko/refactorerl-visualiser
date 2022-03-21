"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNonce = exports.getWebviewOptions = exports.activate = void 0;
const vscode = require("vscode");
const refactorErlView_1 = require("./refactorErlView");
const referlOutput_1 = require("./referlOutput");
const variableOrigin_1 = require("./variableOrigin");
function activate(context) {
    const outputFileName = "/.referloutput.json";
    const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    const workspaceUri = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri : undefined;
    // If there is an opened workspace, than activate
    if (workspaceUri) {
        const outputFilePath = vscode.Uri.joinPath(workspaceUri, outputFileName);
        const referloutput = new referlOutput_1.ReferlOutput(outputFilePath);
        const variableOriginProvider = new variableOrigin_1.VariableOriginProvider(rootPath, outputFilePath);
        vscode.window.registerTreeDataProvider('variableOrigin', variableOriginProvider);
        //vscode.commands.registerCommand('variableOrigin.refreshEntry', () => variableOriginProvider.refresh());
        //vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
        //vscode.commands.registerCommand('variableOrigin.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
        //vscode.commands.registerCommand('variableOrigin.editEntry', (node: OriginItem) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
        //vscode.commands.registerCommand('variableOrigin.deleteEntry', (node: OriginItem) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));
        context.subscriptions.push(vscode.commands.registerCommand('refactorErl.start', () => {
            refactorErlView_1.RefactorErlView.createOrShow(context.extensionUri);
        }));
        if (vscode.window.registerWebviewPanelSerializer) {
            // Make sure we register a serializer in activation event
            vscode.window.registerWebviewPanelSerializer(refactorErlView_1.RefactorErlView.viewType, {
                async deserializeWebviewPanel(webviewPanel, state) {
                    console.log(`Got state: ${state}`);
                    // Reset the webview options so we use latest uri for `localResourceRoots`.
                    webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
                    refactorErlView_1.RefactorErlView.revive(webviewPanel, context.extensionUri);
                }
            });
        }
        context.subscriptions.push(vscode.commands.registerCommand('refactorErl.doRefactor', () => {
            if (refactorErlView_1.RefactorErlView.currentPanel) {
                refactorErlView_1.RefactorErlView.currentPanel.doRefactor();
            }
        }));
    }
}
exports.activate = activate;
function getWebviewOptions(extensionUri) {
    return {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
    };
}
exports.getWebviewOptions = getWebviewOptions;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
exports.getNonce = getNonce;
//# sourceMappingURL=extension.js.map