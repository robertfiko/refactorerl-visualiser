import * as vscode from 'vscode';
import * as path from 'path';

export class VariableOriginProvider implements vscode.TreeDataProvider<OriginItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<OriginItem | undefined | void> = new vscode.EventEmitter<OriginItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<OriginItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined, private outputFilePath: vscode.Uri | undefined) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: OriginItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: OriginItem): Thenable<OriginItem[]> {
		/*if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No dependency in empty workspace');
			return Promise.resolve([]);
		}*/

		
		
		

		
		if (element) {
			const parent = element.label;
			return Promise.resolve([new OriginItem("alma", parent, vscode.TreeItemCollapsibleState.Collapsed)]);
		}

		else {
			return Promise.resolve([new OriginItem("korte", "version", vscode.TreeItemCollapsibleState.Collapsed)]);
		}

		

	}


}

export class OriginItem extends vscode.TreeItem {

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
