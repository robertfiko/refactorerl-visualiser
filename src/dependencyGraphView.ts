import * as vscode from 'vscode';
import { WebSocketHandler } from './webSocketHandler';

class ViewState {
	public textualGraph: any;
}
export class DependencyGraphView {
	public static currentPanel: DependencyGraphView | undefined;
	public static readonly viewType = 'refactorErl';
	private readonly panel: vscode.WebviewPanel;
	private readonly extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	private state: ViewState;

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (DependencyGraphView.currentPanel) {
			DependencyGraphView.currentPanel.panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			DependencyGraphView.viewType,
			'RefactorErl',
			column || vscode.ViewColumn.One,
			DependencyGraphView.getWebviewOptions(extensionUri)
		);

		DependencyGraphView.currentPanel = new DependencyGraphView(panel, extensionUri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		DependencyGraphView.currentPanel = new DependencyGraphView(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this.state = new ViewState();
		this.panel = panel;
		this.extensionUri = extensionUri;

		// Set the webview's initial html content
		this.updateContent();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this.panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this.panel.onDidChangeViewState(
			e => {
				if (this.panel.visible) {
					this.updateContent();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this.panel.webview.onDidReceiveMessage(
			async (message) => {
				if (message.command == "dependecyGraph") {
					const response = await WebSocketHandler.getInstance().request("dependencyGraph", message.params);
					this.state.textualGraph = response;
					this.panel.webview.postMessage({ command: 'printTextualGraph', graph: response });
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
		DependencyGraphView.currentPanel = undefined;

		// Clean up our resources
		this.panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private async updateContent() {
		const webview = this.panel.webview;
		this.panel.title = "RefactorErl: Dependencies";
		const promise = this.getHtmlForWebview(webview);
		this.panel.webview.html = await Promise.resolve(promise);
	}

	private async getHtmlForWebview(webview: vscode.Webview) {
		// Generate URI to be able  to load from webview
		const scriptPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js');
		const scriptUri = (scriptPath).with({ 'scheme': 'vscode-resource' });

		// Local path to css styles
		const styleResetPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'reset.css');
		const stylesPathMainPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'vscode.css');
		const stylesCustomPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'custom.css');

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
		const stylesCustomUri = webview.asWebviewUri(stylesCustomPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = DependencyGraphView.getNonce();

		//Get data back from state
		if (this.state.textualGraph) {
			this.panel.webview.postMessage({ command: 'printTextualGraph', graph: this.state.textualGraph });
		}

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
								<option value="moduleset">Set of modules (!!)</option>
							</select>

							<label for="depgraph-type">Type</label>
							<select name="depgraph-type" id="depgraph-type">
								<option value="whole">Whole graph</option>
								<option value="cyclic">Cyclics sub-graph</option>
							</select>

							<label for="depgraph-start">Starting <span class="modOrFun">**</span> (!!)</label>
							<input type="text" name="depgraph-start">

							<label for="depgraph-connection">Connection <span class="modOrFun">**</span> (!!)</label>
							<input type="text" name="depgraph-connection">

							<label for="depgraph-excluded">Excluded <span class="modOrFun">**</span> (!!)</label>
							<input type="text" name="depgraph-excluded">

							<input type="checkbox" name="vehicle1" value="exclude-otp">
							  <label for="vehicle1">Exclude OTP (!!)</label><br>

							<p>Excluded libraries (!!)</p>

							<p>Output format (!!)</p>




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

	public static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
		return {
			// Enable javascript in the webview
			enableScripts: true,

			// And restrict the webview to only loading content from our extension's `media` directory.
			localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
		};
	}

	// nonce = Number used ONCE
	public static getNonce() {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}




