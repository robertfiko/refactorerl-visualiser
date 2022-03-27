import * as vscode from 'vscode';
import * as path from 'path';
import { ReferlOriginDescriptor, RefactorErlResponse } from './refactorErlResponse';

export class VariableOriginProvider implements vscode.TreeDataProvider<VariableOriginTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<OriginLocationTreeItem | undefined | void> = new vscode.EventEmitter<OriginLocationTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<OriginLocationTreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined, private referloutput: RefactorErlResponse) {
		this.referloutput.subscribeToUpdateJSON(() => {this.refresh();});
	}

	getTreeItem(element: OriginLocationTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: VariableOriginTreeItem): Thenable<VariableOriginTreeItem[]> {
		const file = this.referloutput.file();
		const module = path.basename(file);

		// Filling up children
		if (element) {
			const parent = element.label;
			const origins = this.referloutput.origins();
			const items = new Array<OriginLocationTreeItem>();

			for (const origin of origins) {
				const item = new OriginLocationTreeItem(origin.value, parent, vscode.TreeItemCollapsibleState.None, origin);
				items.push(item);
			}

			return Promise.resolve(items);
		}

		// Module name is sent as root element
		else {
			return Promise.resolve([new VariableOriginTreeItem(module, "", vscode.TreeItemCollapsibleState.Collapsed)]);
		}
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	private static readonly borderDecoration = vscode.window.createTextEditorDecorationType({
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

	static selectOriginItem(origin: ReferlOriginDescriptor) {
		const uri = vscode.Uri.file(origin.file);
		vscode.commands.executeCommand('vscode.open', uri);

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const range = new vscode.Range(origin.from, origin.to);

			const decoration = { range: range, hoverMessage: 'Possible value' };
			activeEditor.setDecorations(this.borderDecoration, [decoration]);

			const newSelection = new vscode.Selection(origin.from, origin.from);
			activeEditor.selection = newSelection;
		}
	}
}

export class VariableOriginTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private readonly version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}-${this.version}`;
		this.description = this.version;

	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};
}

export class OriginLocationTreeItem extends VariableOriginTreeItem {
	constructor(
		public readonly label: string,
		version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly origin: ReferlOriginDescriptor,
		public readonly command?: vscode.Command
	) {
		super(label, version, collapsibleState);
		this.command = new OriginCommand('Hello', 'variableOrigin.goToLocation', origin);
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'number.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'number.svg')
	};
}


export class OriginCommand implements vscode.Command {
	constructor(
		public readonly title: string,
		public readonly command: string,
		origin: ReferlOriginDescriptor
	) {
		this.arguments = [origin];
	}
	tooltip?: string | undefined;
	arguments?: any[] | undefined;
}
