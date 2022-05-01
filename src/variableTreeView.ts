import * as vscode from 'vscode';
import * as path from 'path';
import { DataStorage, RangeCommand, RangeDescriptor, ReferlProvider, ReferlTreeItem, ResponseItem } from './refactorErlTreeView';
export class VariableViewProvider extends ReferlProvider<VarialbeDataStorage> {
	protected data: VarialbeDataStorage;

	constructor() {
		super();
		this.data = new VarialbeDataStorage();
	}

	getTreeItem(element: SubTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ReferlTreeItem): Thenable<ReferlTreeItem[]> {
		const file = this.data.file();
		const module = path.basename(file);
		const variableName = this.data.variableName();

		// Filling up children
		if (element) {
			const parent = element.label;
			const items = this.data.items();
			const displayItems = new Array<SubTreeItem>();

			for (const item of items) {
				const displayItem = new SubTreeItem(item.value, module, vscode.TreeItemCollapsibleState.None, item);
				displayItems.push(displayItem);
			}

			return Promise.resolve(displayItems);
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

	static selectTreeItem(range: RangeDescriptor) {
		super.selectTreeItem(range, this.blueBorderDecoration, range.hoverInfo);
	}
}

export class SubTreeItem extends ReferlTreeItem {
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
		super(label, version, collapsibleState, new RangeCommand('Go To Location', 'variableView.goToLocation', result), iconPath);
	}
}

type VariableDataResponse = {
	items: ResponseItem[]
	file: string
	variableName: string
}

class VarialbeDataStorage implements DataStorage {
	private data!: VariableDataResponse;


	public updateData(data: any) {
		this.data = data;
	}

	private valid(): boolean {
		return this.data != undefined;
	}

	public items(): RangeDescriptor[] {
		if (this.valid()) {
			const items: RangeDescriptor[] = [];
			for (const varItem of this.data.items) {
				items.push(new RangeDescriptor(
					varItem.fromPosLn, 
					varItem.fromPosCol, 
					varItem.toPosLn, 
					varItem.toPosCol,
					varItem.name, 
					this.file(), 
					varItem.hoverInfo)
					);
			}
			return items;
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
