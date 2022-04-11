import * as vscode from 'vscode';
import * as path from 'path';
export class CustomQueryProvider implements vscode.TreeDataProvider<CustomQueryTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<CustomQuerySubTreeItem | undefined | void> = new vscode.EventEmitter<CustomQuerySubTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<CustomQuerySubTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	private data: CustomQueryDataStorage;

	constructor() {
		this.data = new CustomQueryDataStorage();
	}

	getTreeItem(element: CustomQuerySubTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: CustomQueryTreeItem): Thenable<CustomQueryTreeItem[]> {
		//const file = this.data.file();
		//const module = path.basename(file);
		//const variableName = this.data.variableName();

		// Filling up children
		if (element) {
			const fileName = element.label;
			const results = this.data.getResultsInFile(fileName);
			const items = new Array<CustomQuerySubTreeItem>();

			for (const result of results) {
				const item = new CustomQuerySubTreeItem(result.value, "?", vscode.TreeItemCollapsibleState.None, result);
				items.push(item);
			}

			return Promise.resolve(items);
		}

		// Calculating root elements (files)
		else {
			const items = new Array<CustomQueryTreeItem>();
			for (const item of this.data.files()) {
				items.push(new CustomQueryTreeItem(item, this.data.request(), vscode.TreeItemCollapsibleState.Collapsed));
			}
			return Promise.resolve(items);
		}
	}


	public refresh(data: any): void {
		this.data.updateData(data);
		this._onDidChangeTreeData.fire(undefined);
	}

	private static readonly backgroundDecoration = vscode.window.createTextEditorDecorationType({
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			backgroundColor: '#FF7F7F'
		},
		dark: {
			backgroundColor: '#4B0B01'
		}
	});

	static selectResultItem(result: ResultDescriptor) {
		const uri = vscode.Uri.file(result.file);
		vscode.commands.executeCommand('vscode.open', uri);

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const range = new vscode.Range(result.from, result.to);

			const decoration = { range: range, hoverMessage: 'TEST TODO' };
			activeEditor.setDecorations(this.backgroundDecoration, [decoration]);
			activeEditor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);

			const newSelection = new vscode.Selection(result.from, result.from);
			activeEditor.selection = newSelection;
		}
	}
}

export class CustomQueryTreeItem extends vscode.TreeItem {
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

export class CustomQuerySubTreeItem extends CustomQueryTreeItem {
	constructor(
		public readonly label: string,
		version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly result: ResultDescriptor,
		public readonly command?: vscode.Command
	) {
		super(label, version, collapsibleState);
		this.command = new ResultCommand('Go To Location', 'customQuery.goToLocation', result);
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'number.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'number.svg')
	};
}

export class ResultCommand implements vscode.Command {
	constructor(
		public readonly title: string,
		public readonly command: string,
		result: ResultDescriptor
	) {
		this.arguments = [result];
	}
	tooltip?: string | undefined;
	arguments?: any[] | undefined;
}

class CustomQueryDataStorage {
	private data: any //JSON

	public updateData(data: any) {
		this.data = data;
	}

	private valid(): boolean {
		return this.data != undefined;
	}

	public file(): string {
		if (this.valid()) {
			return this.data.file;
		}
		else {
			return "";
		}
	}

	public request(): string {
		if (this.valid()) {
			return String(this.data.request);
		}
		return "";
	}
	
	public files(): string[] {
		if (this.valid()) {
			const items = [];
			for (const item of this.data.response) {
				items.push(item[0]);
			}
			return items;
		}
		else {
			return [];
		}
	}

	public getResultsInFile(fileName: string): ResultDescriptor[] {
		if (this.valid()) {
			let results = [];
			for (const item of this.data.response) {
				if (item[0] == fileName) {
					results = item[1];
					break;
				}
			}

			const items = [];
			for (const result of results) {
				items.push(new ResultDescriptor(result));
			}

			return items;
		}
		else {
			return [];
		}
	}


	public variableName(): string {
		if (this.valid()) {
			return this.data.variableName;
		}
		else {
			return "";
		}
	}

}

export class ResultDescriptor {
	public readonly from: vscode.Position;
	public readonly to: vscode.Position;
	public readonly value: string;
	public readonly file: string;

	constructor(rawOrigin: [number, number, number, number, string, string], file: string = rawOrigin[5]) {
		this.from = new vscode.Position(rawOrigin[0] - 1, rawOrigin[1] - 1);
		this.to = new vscode.Position(rawOrigin[2] - 1, rawOrigin[3]);
		this.value = rawOrigin[4];
		this.file = file;
	}

}