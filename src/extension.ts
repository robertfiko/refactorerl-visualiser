import * as vscode from 'vscode';
import { CustomQueryProvider } from './customQuery';
import { RangeDescriptor } from './refactorErlTreeView';
import { DependencyGraphView } from './dependencyGraphView';
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
			vscode.commands.registerCommand('refactorErl.checkConnection', () => {
				WebSocketHandler.getInstance().checkConnection();
				//WebSocketHandler.getInstance().aliveCheck();
			})
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('refactorErl.tryAgainConnect', () => {
				WebSocketHandler.getInstance().connectTryAgain();
				//WebSocketHandler.getInstance().aliveCheck();
			})
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('refactorErl.dependencyGraph', () => {
				DependencyGraphView.createOrShow(context.extensionUri);
			})
		);

		if (vscode.window.registerWebviewPanelSerializer) {
			// Make sure we register a serializer in activation event
			vscode.window.registerWebviewPanelSerializer(DependencyGraphView.viewType, {
				async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
					console.log(`Got state: ${state}`);
					// Reset the webview options so we use latest uri for `localResourceRoots`.
					webviewPanel.webview.options = DependencyGraphView.getWebviewOptions(context.extensionUri);
					DependencyGraphView.revive(webviewPanel, context.extensionUri);
				}
			});
		}

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




