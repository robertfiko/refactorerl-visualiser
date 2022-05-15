import * as vscode from 'vscode';
import { CustomQueryProvider } from './customQuery';
import { DependencyGraphView } from './dependencyGraphView';
import { BuiltInQViewProvider } from './builtInQTreeView';
import { WebSocketHandler } from './webSocketHandler';
import { RefactorErlCommands } from './refactorErlCommands';

export function activate(context: vscode.ExtensionContext) {
	// Inital function calls
	vscode.commands.executeCommand('setContext', 'refactorErl.nodeReachable', false);
	WebSocketHandler.getInstance();

	// Variable settings
	const workspaceUri = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri : undefined;

	// If there is an opened workspace, than activate
	if (workspaceUri) {
		//Providers
		const builtinViewProvider = new BuiltInQViewProvider();
		vscode.window.registerTreeDataProvider('builtinView', builtinViewProvider);
		
		const customQueryProvider = new CustomQueryProvider();
		vscode.window.registerTreeDataProvider('customQuery', customQueryProvider);
		
		// WebSocket subscriptions
		WebSocketHandler.getInstance().subscribe('builtinView', (eventData) => { 
			builtinViewProvider.refresh(eventData); 
		});

		WebSocketHandler.getInstance().subscribe('dependencyGraph', (data) => {
			DependencyGraphView.createOrShow(context.extensionUri);
			console.log("depg");
			
			console.log(DependencyGraphView.currentPanel);
			
			DependencyGraphView.currentPanel?.setForm(data.params);
			DependencyGraphView.currentPanel?.setTextualGraph(data.data.data);
		});

		// Web View registration

		if (vscode.window.registerWebviewPanelSerializer) {
			// Make sure we register a serializer in activation event
			vscode.window.registerWebviewPanelSerializer(DependencyGraphView.viewType, {
				async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
					// Reset the webview options so we use latest uri for `localResourceRoots`.
					webviewPanel.webview.options = DependencyGraphView.getWebviewOptions(context.extensionUri);
					DependencyGraphView.revive(webviewPanel, context.extensionUri);
				}
			});
		}

		// Simple commands
		RefactorErlCommands.setCommandForContext(context);

		// Custom query dialog hookup
		context.subscriptions.push(vscode.commands.registerCommand('refactorErl.query',async () => {
			if (!WebSocketHandler.getInstance().isConnected()) {
				vscode.window.showErrorMessage("Not connected to RefactorErl. Checn connection with WebSocket and try again.");
				return;
			}
			{
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
	
									console.log(resp);
									
	
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
			}
		}));

		
	}

}




