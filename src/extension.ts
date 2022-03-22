import { readFile } from 'fs';
import * as vscode from 'vscode';
import { RefactorErlView } from './refactorErlView';
import { ReferlOriginDescriptor, RefactorErlResponse } from './refactorErlResponse';
import { VariableOriginProvider, OriginLocationTreeItem } from './variableOrigin';


export function activate(context: vscode.ExtensionContext) {

	const outputFileName = "/.referloutput.json";
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	const workspaceUri = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri : undefined;

	// If there is an opened workspace, than activate
	if (workspaceUri) {
		const outputFilePath = vscode.Uri.joinPath(workspaceUri, outputFileName);
		const referloutput = new RefactorErlResponse(outputFilePath);

		const variableOriginProvider = new VariableOriginProvider(rootPath, referloutput);
		vscode.window.registerTreeDataProvider('variableOrigin', variableOriginProvider);


		context.subscriptions.push(
			vscode.commands.registerCommand('variableOrigin', (origin: ReferlOriginDescriptor) => VariableOriginProvider.selectOriginItem(origin))
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('refactorErl.start', () => {
				RefactorErlView.createOrShow(context.extensionUri);
			})
		);

		if (vscode.window.registerWebviewPanelSerializer) {
			// Make sure we register a serializer in activation event
			vscode.window.registerWebviewPanelSerializer(RefactorErlView.viewType, {
				async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
					console.log(`Got state: ${state}`);
					// Reset the webview options so we use latest uri for `localResourceRoots`.
					webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
					RefactorErlView.revive(webviewPanel, context.extensionUri);
				}
			});
		}

		context.subscriptions.push(
			vscode.commands.registerCommand('refactorErl.doRefactor', () => {
				if (RefactorErlView.currentPanel) {
					RefactorErlView.currentPanel.doRefactor();
				}
			})
		);
	}

}

export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}

export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
