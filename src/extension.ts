import * as vscode from 'vscode';
import { CustomQueryProvider } from './customQuery';
import { NoPosDescriptor, RangeDescriptor } from './refactorErlTreeView';
import { DependencyGraphView } from './dependencyGraphView';
import { VariableViewProvider } from './variableTreeView';
import { WebSocketHandler } from './webSocketHandler';

//TODO: CODE

export function activate(context: vscode.ExtensionContext) {
	vscode.commands.executeCommand('setContext', 'refactorErl.nodeReachable', false);
	WebSocketHandler.getInstance();

	const workspaceUri = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri : undefined;

	// If there is an opened workspace, than activate
	if (workspaceUri) {

		const variableViewProvider = new VariableViewProvider();
		WebSocketHandler.getInstance().subscribe('variableView', (eventData) => { variableViewProvider.refresh(eventData); });
		vscode.window.registerTreeDataProvider('variableView', variableViewProvider);
		context.subscriptions.push(
			vscode.commands.registerCommand('variableView.goToLocation', (item: RangeDescriptor) => VariableViewProvider.selectTreeItem(item))
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('customQuery.noPosNotify', (item: NoPosDescriptor) => vscode.window.showInformationMessage("Corresponding source file is not loaded"))
		);

		const customQueryProvider = new CustomQueryProvider();
		vscode.window.registerTreeDataProvider('customQuery', customQueryProvider);
		context.subscriptions.push(
			vscode.commands.registerCommand('customQuery.goToLocation', (item: RangeDescriptor) => CustomQueryProvider.selectResultItem(item))
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
			vscode.commands.registerCommand('refactorErl.dependencyGraph', (data) => {
				DependencyGraphView.createOrShow(context.extensionUri);
			})
		);

		WebSocketHandler.getInstance().subscribe('dependencyGraph', (data) => {
			DependencyGraphView.createOrShow(context.extensionUri);
			DependencyGraphView.currentPanel?.setForm(data.params);
			//console.log(data.data.data);
			console.log(DependencyGraphView.currentPanel);
			DependencyGraphView.currentPanel?.setTextualGraph(data.data.data);
			//data.data the graph
		});

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
								console.log(value);
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




