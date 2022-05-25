import * as vscode from 'vscode';
import { WebSocketHandler } from './webSocketHandler';
import { TextualGraph, DependencyGraphState, GraphResponse, PathLike, ExtensionMessageParam, WebViewMessageCommands, WebViewMessageParam } from "./depgraphView/depgraph";
import { throws } from 'assert';
class ViewState {
	graph: GraphState | undefined;
	formState: DependencyGraphState | undefined
}

type GraphState =
	{
		status: "ok"
		type: "svg",
		path: PathLike,
	}
	|
	{	
		status: "ok",
		type: "textual",
		textualGraph: TextualGraph[],
	}
	|
	{
		status: "failed",
		data: string
	}

export class DependencyGraphView {
	public static currentPanel: DependencyGraphView | undefined;
	public static readonly viewType = 'refactorErl';
	private readonly panel: vscode.WebviewPanel;
	private readonly extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	private state!: ViewState;

	private postMessage(param: ExtensionMessageParam) {
		this.panel.webview.postMessage(param);
	}

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
		this.panel = panel;
		this.extensionUri = extensionUri;
		this.state = new ViewState();

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
			async (message: WebViewMessageParam) => {
				if (message.command == 'dependencyGraph') {
					vscode.window.withProgress({
						location: vscode.ProgressLocation.Notification,
						title: `Generating dependeny graph`,
						cancellable: false
					}, (progress) => {
						const responsePromise = WebSocketHandler.getInstance().request("dependencyGraph", message.params);
						responsePromise.then(
							(resolvedData: GraphResponse) => {
								console.log(resolvedData);
								if (resolvedData.status == "ok") {
									if (resolvedData.type == "textual") {
										this.setTextualGraph(resolvedData.data);
									}
									else if (resolvedData.type == "svg") {
										this.setSvgGraph(resolvedData.data);
										this.openSvg(resolvedData.data);
									}

								}
								else if (resolvedData.status == "failed") {
									vscode.window.showErrorMessage(resolvedData.data);
									this.postMessage({ command: 'textualGraphError', error: resolvedData.data });
									this.state.graph = {
										status: "failed",
										data: resolvedData.data
									};
								}

							},
							(rejectCause) => {
								vscode.window.showErrorMessage("Graph request error: " + rejectCause);
								const errorMsg = "Graph request error: " + rejectCause;
								this.postMessage({ command: 'textualGraphError', error: errorMsg });
								this.state.graph = {
									status: "failed",
									data: errorMsg
								};
							}
						);
						return responsePromise;
					});
				}
				else if (message.command == 'formState') {
					this.state.formState = message.params;
				}

				else if (message.command == 'openSvg') {
					this.openSvg(message.params);
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

	public setForm(param: DependencyGraphState | undefined) {
		if (param) {
			this.state.formState = param;
			console.log(param);
			this.postMessage({ command: 'setForm', data: param });
		}

	}

	public setTextualGraph(graph: TextualGraph[]) {
		this.state.graph = {
			status: "ok",
			type: "textual",
			textualGraph: graph
		};
		this.postMessage({ command: 'printTextualGraph', graph: graph });
	}

	public setSvgGraph(graphPath: PathLike) {
		this.state.graph = {
			status: "ok",
			type: "svg",
			path: graphPath
		};
		this.postMessage({ command: 'svgGraphPath', path: graphPath });
	}

	private updateDataOnWebView() {
		if (this.state) {
			if (this.state.graph && this.state.graph.status == "ok") {
				switch (this.state.graph.type) {
					case "textual":
						this.setTextualGraph(this.state.graph.textualGraph);
						this.setForm(this.state.formState);
						break;

					case "svg":
						this.setSvgGraph(this.state.graph.path);
						this.setForm(this.state.formState);
						break;

					default:
						break;
				}
			}

			else if (this.state.graph?.status == "failed") {
				this.postMessage({ command: 'textualGraphError', error: this.state.graph.data });
				this.setForm(this.state.formState);
			}
		}

	}

	private async updateContent() {
		const webview = this.panel.webview;
		this.panel.title = "RefactorErl: Dependencies";
		const promise = this.getHtmlForWebview(webview);
		this.panel.webview.html = await Promise.resolve(promise);
		this.updateDataOnWebView();
	}

	private async getHtmlForWebview(webview: vscode.Webview) {
		// Generate URI to be able  to load from webview
		const scriptPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'out', 'webviewMain.js');
		const scriptUri = (scriptPath).with({ 'scheme': 'vscode-resource' });

		// Local path to css styles
		const styleResetPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'reset.css');
		const stylesPathMainPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'vscode.css');
		const stylesCustomPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'custom.css');
		const svgTestPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'mygraph.svg');

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
		const stylesCustomUri = webview.asWebviewUri(stylesCustomPath);
		const svgTesturi = webview.asWebviewUri(svgTestPath);


		// Use a nonce to only allow specific scripts to be run
		const nonce = DependencyGraphView.getNonce();

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
								<option value="func">Function</option>
								<option value="mod">Module</option>
							</select>

							<label for="depgraph-type">Type</label>
							<select name="depgraph-type" id="depgraph-type">
								<option value="all">Whole graph</option>
								<option value="cycles">Cyclics sub-graph</option>
							</select>

							<small>Separate by ;</small><br>
							<label for="depgraph-start">Starting <span class="modOrFun">**</span></label>
							<input id="depgraph-start" type="text" name="depgraph-start" placeholder="e.g.: module:fun/1">
							
							<small>Separate by ;</small><br>
							<label for="depgraph-connection">Connection <span class="modOrFun">**</span></label>
							<input id="depgraph-connection" type="text" name="depgraph-connection" placeholder="e.g.: module:fun/1">

							<small>Separate by ;</small><br>
							<label for="depgraph-excluded">Excluded <span class="modOrFun">**</span></label>
							<input id="depgraph-excluded" type="text" name="depgraph-excluded" placeholder="e.g.: module:fun/1">

							<input type="checkbox" name="exclude-otp" value="exclude-otp" id="exclude-otp">
							  <label for="exclude-otp">Exclude OTP</label><br>

							<small>Separate by ;</small><br>
							<label for="depgraph-excludedlib">Excluded libraries</label>
							<input id="depgraph-excludedlib" type="text" name="depgraph-excludedlib" placeholder="/path/to/library/">

							<label for="depgraph-output">Output format</label>
							<select name="depgraph-output" id="depgraph-output">
								<option value="textual">Plain textual</option>
								<option value="svg">SVG</option>
							</select>

							<button type="button" id="graph-properties-generate">Generate</button>
							<button type="button" id="clear">Clear</button>


						</form>
					</td>
					<td id="view-column">
						Please make sure that the window is activated and selected.
					</td>
				</tr>
			</table>
			<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
		</body>
		
		</html>`;
	}

	public static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
		return {
			// Enable javascript in the webview
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media', 'webview',)]
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

	private openSvg(path: PathLike) {
		const uri = vscode.Uri.file(path);
		vscode.commands.executeCommand('_svg.showSvgByUri', uri);
	}
}




