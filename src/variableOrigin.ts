import * as vscode from 'vscode';
import * as path from 'path';
import { DataStorage, RangeCommand, RangeDescriptor, ReferlProvider, ReferlTreeItem } from './refactorErlTreeView';
export class VariableOriginProvider extends ReferlProvider<VarialbeOriginDataStorage> {
	protected data: VarialbeOriginDataStorage;

	constructor() {
		super();
		this.data = new VarialbeOriginDataStorage();
	}

	getTreeItem(element: OriginSubTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ReferlTreeItem): Thenable<ReferlTreeItem[]> {
		const file = this.data.file();
		const module = path.basename(file);
		const variableName = this.data.variableName();

		// Filling up children
		if (element) {
			const parent = element.label;
			const origins = this.data.origins();
			const items = new Array<OriginSubTreeItem>();

			for (const origin of origins) {
				const item = new OriginSubTreeItem(origin.value, module, vscode.TreeItemCollapsibleState.None, origin);
				items.push(item);
			}

			return Promise.resolve(items);
		}

		// Module name is sent as root element
		else {
			if (module) {
				return Promise.resolve([new ReferlTreeItem(variableName, "", vscode.TreeItemCollapsibleState.Collapsed)]);
			}
			else {
				return Promise.resolve([]);
			}
		}
	}

	static selectOriginItem(range: RangeDescriptor) {
		super.selectTreeItem(range, this.blueBorderDecoration, "Possible value");
	}
}

export class OriginSubTreeItem extends ReferlTreeItem {
	constructor(
		public readonly label: string,
		version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly result: RangeDescriptor,
		public readonly iconPath = {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'number.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'number.svg')
		}
	) {
		super(label, version, collapsibleState, new RangeCommand('Go To Location', 'variableOrigin.goToLocation', result), iconPath);
	}
}

class VarialbeOriginDataStorage implements DataStorage {
	private data: any //JSON

	public updateData(data: any) {
		this.data = data;
	}

	private valid(): boolean {
		return this.data != undefined;
	}

	public origins(): RangeDescriptor[] {
		if (this.valid()) {
			const origins: RangeDescriptor[] = [];
			for (const rawOrigin of this.data.origins) {
				origins.push(new RangeDescriptor(rawOrigin, this.file()));
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
