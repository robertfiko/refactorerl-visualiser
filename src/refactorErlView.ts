import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import { getWebviewOptions, getNonce } from './extension';
import { WebSocketHandler } from './webSocketHandler';

//TODO:

/**
 * Manages cat coding webview panels
 */
export class RefactorErlView {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: RefactorErlView | undefined;
	private referlOutputDiscovered: boolean;
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

	public async makeRequest() {
		const data = "";
		const value = await WebSocketHandler.getInstance().request("dependencyGraph", "");
		/*let value = undefined;
		resp.then(
			(ok) => {
				console.log("Resolved"); 
				console.log(ok);
				value = ok;
			}
		);*/



		return value;
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this.referlOutputDiscovered = false;
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
					//TODO: JS script should get some kind of inital thing as this is a thign
					//this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);


		if (vscode.workspace.workspaceFolders !== undefined) {
			const workspaceUri = vscode.workspace.workspaceFolders[0].uri;

			const outputFileName = "/.referloutput.json";
			const outputFilePath = vscode.Uri.joinPath(workspaceUri, outputFileName);
			const watcher = vscode.workspace.createFileSystemWatcher(outputFilePath.fsPath);
			this.outputFilePath = outputFilePath;

			let exsits = false;
			try {
				vscode.workspace.fs.stat(outputFilePath);
				exsits = true;
				this.doUpdateResponse();
			} catch {
				watcher.onDidCreate(() => {
					vscode.window.showInformationMessage("Created!");
					this.doUpdateResponse();
					//this.openViewOnSide(outputFilePath);
					//this._update();
				});
			}

			watcher.onDidChange(() => {
				vscode.window.showInformationMessage("Changed!");
				this.doUpdateResponse();
				//this.openViewOnSide(outputFilePath);
				//this._update();
			});

		}
	}

	private async doUpdateResponse() {
		if ( /*this.referlOutputDiscovered &&*/this.outputFilePath != undefined) {
			const uri: vscode.Uri = this.outputFilePath;
			const JsonString = await vscode.workspace.openTextDocument(uri).then((document) => {
				return document.getText();
			});
			const response = JSON.parse(JsonString);
			this._panel.webview.postMessage({ command: 'updateResponse', data: response });
		}
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
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
		this._panel.title = "TEST";
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
		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');

		// And the uri we use to load this script in the webview
		const scriptUri = (scriptPathOnDisk).with({ 'scheme': 'vscode-resource' });

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

		let serverresp = "hehe.. no";
		const p  =await  WebSocketHandler.getInstance().request("dependencyGraph", "");
		console.log(p);
		serverresp = p;

		this._panel.webview.postMessage({ command: 'printTextualGraph', graph: p});

		
	



		//TODO: if the response is undefined
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
			<table>
				<tr>
					<th>Properties</th>
					<th>View</th>
				</tr>
				<tr>
					<td id="properties-container">
						<form>
							<label for="depgraph-level">Level</label>
							<select name="depgraph-level" id="depgraph-level">
								<option value="depgraph-level-fun">Function</option>
								<option value="depgraph-level-mod">Module</option>
								<option value="depgraph-level-modset">Set of modules (not available)</option>
							</select>
		
							<label for="depgraph-type">Type</label>
							<select name="depgraph-type" id="depgraph-type">
								<option value="depgraph-type-whole">Whole graph</option>
								<option value="depgraph-type-cyclic">Cyclics sub-graph</option>
							</select>
		
							<label for="depgraph-start">Starting **</label>
							<input type="text" name="depgraph-start">

							<button>Generate</button>
		
		
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


//TODO: Sometimes this becomes... clumsy
//TODO: what is nonce
