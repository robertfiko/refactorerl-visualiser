import * as vscode from 'vscode';
import * as path from 'path';
import { DataStorage, ItemDescriptor, NoPosDescriptor, NotificationCommand, RangeCommand, RangeDescriptor, ReferlProvider, ReferlTreeItem, ResponseItem } from './refactorErlTreeView';
import { WebSocketHandler } from './webSocketHandler';
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
				const item = new CustomQuerySubTreeItem(result.title, result.subtitle, vscode.TreeItemCollapsibleState.None, result);
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
	//TODO: fix this
	async inputDialogExecuter () {
			const result = await vscode.window.showInputBox({
				placeHolder: 'Enter a query, for example: `mods.funs`',
			});
			if (result) {
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: `Running: ${result} `,
					cancellable: false
				}, (progress) => {

					const response = WebSocketHandler.getInstance().request('customQueryRequest', result);
					response.then(
						(value) => {							
							
							if (value.status == "ok") {
								vscode.window.showInformationMessage(`Done: ${result} `);
								console.log(value);
								const resp = {
									response: value.data,
									request: value.request,
								};

								console.log(resp);
								

								super.refresh(resp);


							}
							else {
								console.log(value);
								vscode.window.showErrorMessage(`Error with request: ${result} `);
							}

						},
						(error) => { vscode.window.showErrorMessage(`Timeout: ${result} `); }
					);

					return response;
				});
			}
		}
}

export class CustomQuerySubTreeItem extends ReferlTreeItem {
	public readonly command: vscode.Command;

	constructor(
		public readonly label: string,
		version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly result: ItemDescriptor,
		command = undefined,
		public readonly iconPath = {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'number.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'number.svg')
		},
	) {
		super(label, version, collapsibleState, command, iconPath);

		if (result.hasRange) {
			this.command = new RangeCommand(result);
		}
		else {
			this.command = new NotificationCommand(result);
		}
	}
}

type ResponseWrapper = {
	file: string,
	items: ResponseItem[]
}

type CustomQueryDataResponse = {
	request: string
	response: ResponseWrapper[];
}

class CustomQueryDataStorage implements DataStorage {
	private data!: CustomQueryDataResponse;

	public updateData(data: any) {
		this.data = data;
	}

	private valid(): boolean {
		return this.data != undefined;
	}

	public request(): string {
		if (this.valid()) {
			return String(this.data.request);
		}
		return "";
	}
	
	public files(): string[] {
		console.log("XD");
		
		console.log(this.data);
		
		if (this.valid()) {
			const items = [];
			for (const item of this.data.response) {
				items.push(item.file);
			}
			return items;
		}
		else {
			return [];
		}
	}

	public getResultsInFile(fileName: string): ItemDescriptor[] {
		if (this.valid()) {
			let results: ResponseItem[] = [];
			for (const item of this.data.response) {
				if (item.file == fileName) {
					results = item.items;
					break;
				}
			}

			const items: ItemDescriptor[] = [];
			for (const result of results) {
				if (result.noPos) {
					items.push(new NoPosDescriptor(result.name)); 
				}
				else {
					items.push(new RangeDescriptor(
						result.fromPosLn,
						result.fromPosCol,
						result.toPosLn,
						result.toPosCol,
						result.name,
					result.file, "Custom Query Result"));
				}
				
			}

			return items;
		}
		else {
			return [];
		}
	}

}
