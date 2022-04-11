import * as vscode from 'vscode';
import * as path from 'path';
export class VariableOriginProvider implements vscode.TreeDataProvider<VariableOriginTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<OriginLocationTreeItem | undefined | void> = new vscode.EventEmitter<OriginLocationTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<OriginLocationTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	private data: VarialbeOriginDataStorage;

	constructor() {
		this.data = new VarialbeOriginDataStorage();
	}

	getTreeItem(element: OriginLocationTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: VariableOriginTreeItem): Thenable<VariableOriginTreeItem[]> {
		const file = this.data.file();
		const module = path.basename(file);
		const variableName = this.data.variableName();

		// Filling up children
		if (element) {
			const parent = element.label;
			const origins = this.data.origins();
			const items = new Array<OriginLocationTreeItem>();

			for (const origin of origins) {
				const item = new OriginLocationTreeItem(origin.value, module, vscode.TreeItemCollapsibleState.None, origin);
				items.push(item);
			}

			return Promise.resolve(items);
		}

		// Module name is sent as root element
		else {
			if (module) {
				return Promise.resolve([new VariableOriginTreeItem(variableName, "", vscode.TreeItemCollapsibleState.Collapsed)]);
			}
			else {
				return Promise.resolve([]);
			}
		}
	}


	public refresh(data: any): void {
		this.data.updateData(data);
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

	static selectOriginItem(origin: OriginDescriptor) {
		const uri = vscode.Uri.file(origin.file);
		vscode.commands.executeCommand('vscode.open', uri);

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const range = new vscode.Range(origin.from, origin.to);

			const decoration = { range: range, hoverMessage: 'Possible value' };
			activeEditor.setDecorations(this.borderDecoration, [decoration]);
			activeEditor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);

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
		public readonly origin: OriginDescriptor,
		public readonly command?: vscode.Command
	) {
		super(label, version, collapsibleState);
		this.command = new OriginCommand('Go To Location', 'variableOrigin.goToLocation', origin);
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
		origin: OriginDescriptor
	) {
		this.arguments = [origin];
	}
	tooltip?: string | undefined;
	arguments?: any[] | undefined;
}

class VarialbeOriginDataStorage {
	private data: any //JSON
	
	public updateData(data: any) {
		this.data = data;
	}

	private valid(): boolean {
		return this.data != undefined;
	}

	public origins(): OriginDescriptor[] {
		if (this.valid()) {
			const origins: OriginDescriptor[] = [];
			for (const rawOrigin of this.data.origins) {
				origins.push(new OriginDescriptor(rawOrigin, this.file()));
			}
			return origins;
		}
		else {
			return [];
		}
	}
	public file(): string {
		if (this.valid()) {
			return this.data.file;
		}
		else {
			return "";
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

export class OriginDescriptor {
	public readonly from: vscode.Position;
	public readonly to: vscode.Position;
	public readonly value: string;
	public readonly file: string;

	constructor (rawOrigin: [number, number, number, number, string], file: string)  {
		this.from = new vscode.Position(rawOrigin[0]-1, rawOrigin[1]-1);
		this.to = new vscode.Position(rawOrigin[2]-1, rawOrigin[3]);
		this.value = rawOrigin[4];
		this.file = file;
	}

}