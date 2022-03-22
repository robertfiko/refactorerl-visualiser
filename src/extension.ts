import { readFile } from 'fs';
import * as vscode from 'vscode';
import { RefactorErlView } from './refactorErlView';
import { ReferlOrigin, ReferlOutput } from './referlOutput';
import { VariableOriginProvider, OriginItem } from './variableOrigin';


export function activate(context: vscode.ExtensionContext) {

	const outputFileName = "/.referloutput.json";
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	const workspaceUri = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri : undefined;

	// If there is an opened workspace, than activate
	if (workspaceUri) {
		const outputFilePath = vscode.Uri.joinPath(workspaceUri, outputFileName);
		const referloutput = new ReferlOutput(outputFilePath);

		const variableOriginProvider = new VariableOriginProvider(rootPath, referloutput);
		vscode.window.registerTreeDataProvider('variableOrigin', variableOriginProvider);
		//vscode.commands.registerCommand('variableOrigin.refreshEntry', () => variableOriginProvider.refresh());
		//vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
		//vscode.commands.registerCommand('variableOrigin.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
		//vscode.commands.registerCommand('variableOrigin.editEntry', (node: OriginItem) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
		//vscode.commands.registerCommand('variableOrigin.deleteEntry', (node: OriginItem) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));

		const borderDecoration = vscode.window.createTextEditorDecorationType({
			borderWidth: '1px',
			borderStyle: 'solid',
			overviewRulerColor: 'blue',
			overviewRulerLane: vscode.OverviewRulerLane.Right,
			light: {
				borderColor: 'darkblue'
			},
			dark: {
				borderColor: 'lightblue'
			}
		});


		context.subscriptions.push(
			vscode.commands.registerCommand('variableOrigin.sayhello', (origin: ReferlOrigin) => {
				const uri = vscode.Uri.file(origin.file);
				vscode.commands.executeCommand('vscode.open', uri);

				const activeEditor = vscode.window.activeTextEditor;
				if (activeEditor) {
					const range = new vscode.Range(origin.from, origin.to);

					const decoration = { range: range, hoverMessage: 'Possible value' };
					activeEditor.setDecorations(borderDecoration, [decoration]);

					const position = activeEditor.selection.active;
			
					const newSelection = new vscode.Selection(origin.from, origin.from);
					activeEditor.selection = newSelection;
				}

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
