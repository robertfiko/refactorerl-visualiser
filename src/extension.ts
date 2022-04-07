import * as vscode from 'vscode';
import { RefactorErlView } from './refactorErlView';
import { VariableOriginProvider, OriginDescriptor } from './variableOrigin';
import { WebSocketHandler } from './webSocketHandler';

export function activate(context: vscode.ExtensionContext) {
	vscode.commands.executeCommand('setContext', 'refactorErl.nodeReachable', false);
	WebSocketHandler.getInstance();

	const workspaceUri = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri : undefined;

	// If there is an opened workspace, than activate
	if (workspaceUri) {

		const variableOriginProvider = new VariableOriginProvider();
		WebSocketHandler.getInstance().subscribe('variableOrigin', (eventData) => { variableOriginProvider.refresh(eventData);});

		vscode.window.registerTreeDataProvider('variableOrigin', variableOriginProvider);


		context.subscriptions.push(
			vscode.commands.registerCommand('variableOrigin.goToLocation', (origin: OriginDescriptor) => VariableOriginProvider.selectOriginItem(origin))
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('refactorErl.checkWebSocket', () => WebSocketHandler.getInstance().connect())
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
