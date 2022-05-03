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
		const variableName = this.data.variableName();

		// Filling up children
		if (element) {
			const parent = element.label;
			const items = this.data.items();
			const displayItems = new Array<SubTreeItem>();

			for (const item of items) {
				const module = path.basename(item.file);
				const displayItem = new SubTreeItem(item.title, module, vscode.TreeItemCollapsibleState.None, item);
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
		super(label, version, collapsibleState, new RangeCommand(result), iconPath);
	}
}

type VariableDataResponse = {
	items: ResponseItem[]
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
					varItem.file, 
					varItem.hoverInfo)
					);
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
