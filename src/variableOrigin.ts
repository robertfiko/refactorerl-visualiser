import * as vscode from 'vscode';
import * as path from 'path';
import { ReferlOrigin, ReferlOutput } from './referlOutput';

export class VariableOriginProvider implements vscode.TreeDataProvider<ReferlTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<OriginItem | undefined | void> = new vscode.EventEmitter<OriginItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<OriginItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined, private referloutput: ReferlOutput) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: OriginItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ReferlTreeItem): Thenable<ReferlTreeItem[]> {
		const LINE = 0;
		const COL = 1;
		const VAL = 2;

		const file = this.referloutput.file();
		const module = path.basename(file);

		// Filling up children
		if (element) {
			const parent = element.label;
			const origins = this.referloutput.origins();
			const items = new Array<OriginItem>();

			for (const origin of origins) {
				const item = new OriginItem(origin.value, parent, vscode.TreeItemCollapsibleState.None, origin);
				items.push(item);
			}

			return Promise.resolve(items);
		}

		// Module name is sent as root element
		else {
			return Promise.resolve([new ReferlTreeItem(module, "", vscode.TreeItemCollapsibleState.Collapsed)]);
		}
	}


}

export class ReferlTreeItem extends vscode.TreeItem {

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

	contextValue = 'dependency';
}

export class OriginItem extends ReferlTreeItem {

	constructor(
		public readonly label: string,
		version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly origin: ReferlOrigin,
		public readonly command?: vscode.Command
	) {
		super(label, version, collapsibleState);

		this.command = new OriginCommand('Hello', 'variableOrigin.sayhello', origin);

	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'number.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'number.svg')
	};

	contextValue = 'dependency';
}



export class OriginCommand implements vscode.Command{
	constructor(
		public readonly title: string,
		public readonly command: string,
		origin: ReferlOrigin
	) {
		this.arguments = [origin];
	}
	tooltip?: string | undefined;
	arguments?: any[] | undefined;
	

	
	
}
