import * as vscode from 'vscode';
import { WebSocketHandler } from './webSocketHandler';

//TODO: Code rendezés
export class RefactorErlView {
	public static currentPanel: RefactorErlView | undefined;
	public static readonly viewType = 'refactorErl';
	private outputFilePath: vscode.Uri | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (RefactorErlView.currentPanel) {
			RefactorErlView.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			RefactorErlView.viewType,
			'RefactorErl',
			column || vscode.ViewColumn.One,
			getWebviewOptions(extensionUri)
		);

		RefactorErlView.currentPanel = new RefactorErlView(panel, extensionUri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		RefactorErlView.currentPanel = new RefactorErlView(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			async (message) => {
				if (message.command == "dependecyGraph") {
					const response = await WebSocketHandler.getInstance().request("dependencyGraph", message.params);
					this._panel.webview.postMessage({ command: 'printTextualGraph', graph: response});
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
		RefactorErlView.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private async _update() {
		const webview = this._panel.webview;
		this._panel.title = "RefactorErl: Dependencies";
		const promise = this._getHtmlForWebview(webview);
		this._panel.webview.html = await Promise.resolve(promise);
	}


	private openViewOnSide(uri: vscode.Uri) {
		const visible = vscode.window.visibleTextEditors;
		const docs = [];
		for (const visi of visible) {
			docs.push(visi.document.uri.toString());
		}

		console.log(docs);
		//vscode.window.showTextDocument(uri, { viewColumn: vscode.ViewColumn.Beside });
	}

	private async _getHtmlForWebview(webview: vscode.Webview) {
		// Generate URI to be able  to load from webview
		const scriptPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');
		const scriptUri = (scriptPath).with({ 'scheme': 'vscode-resource' });

		// Local path to css styles
		const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
		const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css');
		const stylesCustomPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'custom.css');

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
		const stylesCustomUri = webview.asWebviewUri(stylesCustomPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `
		<!DOCTYPE html>
		<html lang="en">
		
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy"
				content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
		
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
		
			<link href="${stylesResetUri}" rel="stylesheet">
			<link href="${stylesMainUri}" rel="stylesheet">
			<link href="${stylesCustomUri}" rel="stylesheet">
		
		</head>
		
		<body>
			<table id="graph-container">
				<tr>
					<th>Properties</th>
					<th>View</th>
				</tr>
				<tr>
					<td id="properties-container">
						<form id="graph-properties">
							<label for="depgraph-level">Level</label>
							<select name="depgraph-level" id="depgraph-level">
								<option value="function">Function</option>
								<option value="module">Module</option>
								<option value="moduleset">Set of modules (not available)</option>
							</select>
		
							<label for="depgraph-type">Type</label>
							<select name="depgraph-type" id="depgraph-type">
								<option value="whole">Whole graph</option>
								<option value="cyclic">Cyclics sub-graph</option>
							</select>
		
							<label for="depgraph-start">Starting **</label>
							<input type="text" name="depgraph-start">

							<button type="button" id="graph-properties-generate">Generate</button>
							<button type="button" id="clear">Clear</button>
		
		
						</form>
					</td>
					<td id="view-column">
						
					</td>
				</tr>
			</table>

			<h1 id="refac">NO</h1>

			<script nonce="${nonce}" src="${scriptUri}"></script>
		</body>
		
		</html>`;
	}
}


// nonce = Number used ONCE
export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}