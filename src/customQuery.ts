import * as vscode from 'vscode';
import * as path from 'path';
import { DataStorage, RangeCommand, RangeDescriptor, ReferlProvider, ReferlTreeItem } from './refactorErlTreeView';
export class CustomQueryProvider extends ReferlProvider<CustomQueryDataStorage> {
	protected data: CustomQueryDataStorage;

	constructor() {
		super();
		this.data = new CustomQueryDataStorage();
	}

	getTreeItem(element: ReferlTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ReferlTreeItem): Thenable<ReferlTreeItem[]> {
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
			const items = new Array<ReferlTreeItem>();
			for (const item of this.data.files()) {
				items.push(new ReferlTreeItem(item, this.data.request(), vscode.TreeItemCollapsibleState.Collapsed));
			}
			return Promise.resolve(items);
		}
	}

	static selectResultItem(result: RangeDescriptor) {
		super.selectTreeItem(result, super.redBackgroundDecoration, 'Custom Query Result');
	}
}

export class CustomQuerySubTreeItem extends ReferlTreeItem {
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
		super(label, version, collapsibleState, new RangeCommand('Go To Location', 'customQuery.goToLocation', result), iconPath);
	}
}

class CustomQueryDataStorage implements DataStorage {
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

	public getResultsInFile(fileName: string): RangeDescriptor[] {
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
				items.push(new RangeDescriptor(result, result[5]));
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
