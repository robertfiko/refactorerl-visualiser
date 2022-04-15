import * as vscode from 'vscode';
import { CustomQueryProvider } from './customQuery';
import { RangeDescriptor } from './refactorErlTreeView';
import { RefactorErlView } from './refactorErlView';
import { VariableOriginProvider } from './variableOrigin';
import { WebSocketHandler } from './webSocketHandler';

//TODO: CODE

export function activate(context: vscode.ExtensionContext) {
	vscode.commands.executeCommand('setContext', 'refactorErl.nodeReachable', false);
	WebSocketHandler.getInstance();

	const workspaceUri = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri : undefined;

	// If there is an opened workspace, than activate
	if (workspaceUri) {

		const variableOriginProvider = new VariableOriginProvider();
		WebSocketHandler.getInstance().subscribe('variableOrigin', (eventData) => { variableOriginProvider.refresh(eventData); });
		vscode.window.registerTreeDataProvider('variableOrigin', variableOriginProvider);
		context.subscriptions.push(
			vscode.commands.registerCommand('variableOrigin.goToLocation', (origin: RangeDescriptor) => VariableOriginProvider.selectOriginItem(origin))
		);

		const customQueryProvider = new CustomQueryProvider();
		vscode.window.registerTreeDataProvider('customQuery', customQueryProvider);
		context.subscriptions.push(
			vscode.commands.registerCommand('customQuery.goToLocation', (origin: RangeDescriptor) => CustomQueryProvider.selectResultItem(origin))
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('refactorErl.checkWebSocket', () => {
				WebSocketHandler.getInstance().reConnect();
				//WebSocketHandler.getInstance().aliveCheck();
			})
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

		context.subscriptions.push( //TODO: remove
			vscode.commands.registerCommand('refactorErl.doRefactor', () => {
				if (RefactorErlView.currentPanel) {
					RefactorErlView.currentPanel.doRefactor();
				}
			})
		);

		context.subscriptions.push(vscode.commands.registerCommand('refactorErl.query', async () => {
			const result = await vscode.window.showInputBox({
				placeHolder: 'Enter a query, for example: `mods.funs`',
			});
			if (result) {
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: `Running: ${result} `,
					cancellable: false
				}, (progress) => {

					const response = WebSocketHandler.getInstance().request('customQueryRequest', result);
					response.then(
						(value) => {
							if (value.status == "ok") {
								vscode.window.showInformationMessage(`Done: ${result} `);
								console.log(value);
								const resp = {
									response: value.data,
									request: value.request,
								};
								customQueryProvider.refresh(resp);

							}
							else {
								vscode.window.showErrorMessage(`Error with request: ${result} `);
							}

						},
						(error) => { vscode.window.showErrorMessage(`Timeout: ${result} `); }
					);

					return response;
				});
			}
		}));
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
