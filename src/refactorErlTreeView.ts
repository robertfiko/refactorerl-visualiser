import * as vscode from 'vscode';
import * as path from 'path';
export abstract class ReferlProvider<DataStorageType extends DataStorage, Type extends ReferlTreeItem = ReferlTreeItem> implements vscode.TreeDataProvider<ReferlTreeItem> {

	protected _onDidChangeTreeData: vscode.EventEmitter<Type | undefined | void> = new vscode.EventEmitter<Type | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Type | undefined | void> = this._onDidChangeTreeData.event;
	protected abstract data: DataStorageType;


	abstract getTreeItem(element: ReferlTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem>;
	abstract getChildren(element?: ReferlTreeItem): vscode.ProviderResult<ReferlTreeItem[]>;

	public refresh(data: any): void {
		this.data.updateData(data);
		this._onDidChangeTreeData.fire(undefined); 
	}

	protected static readonly blueBorderDecoration = vscode.window.createTextEditorDecorationType({
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

	protected static readonly redBackgroundDecoration = vscode.window.createTextEditorDecorationType({
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			backgroundColor: '#FF7F7F'
		},
		dark: {
			backgroundColor: '#4B0B01'
		}
	});

	static selectTreeItem(rangeDescriptor: RangeDescriptor, decoration: vscode.TextEditorDecorationType, message: string) {
		const uri = vscode.Uri.file(rangeDescriptor.file);
		vscode.commands.executeCommand('vscode.open', uri).then(() => {
			const activeEditor = vscode.window.activeTextEditor;
			console.log(activeEditor);
			if (activeEditor) {
				const range = new vscode.Range(rangeDescriptor.from, rangeDescriptor.to);

				const deco = { range: range, hoverMessage: message };
				activeEditor.setDecorations(decoration, [deco]);
				setTimeout(() => {
					activeEditor.setDecorations(decoration, []);
				}, 3000);
				activeEditor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);

				const newSelection = new vscode.Selection(rangeDescriptor.from, rangeDescriptor.from);
				activeEditor.selection = newSelection;
			}
		});

		
	}
}

export class ReferlTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private readonly version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command,
		public readonly iconPath = {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
		}) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}-${this.version}`;
		this.description = this.version;
	}
}


export class RangeCommand implements vscode.Command {
	public readonly command: string;
	public readonly title: string;
	constructor(
		item: ItemDescriptor
	) {
		this.arguments = [item];
		this.command = "customQuery.goToLocation";
		this.title = "Go To Location";
	}
	tooltip?: string | undefined;
	arguments?: any[] | undefined;
}

export class NotificationCommand implements vscode.Command {
	public readonly command: string;
	public readonly title: string;
	constructor(
		item: ItemDescriptor
	) {
		this.arguments = [item];
		this.command = "customQuery.noPosNotify";
		this.title = "Corresponding source file is not loaded";
	}
	tooltip?: string | undefined;
	arguments?: any[] | undefined;
}



export interface ItemDescriptor {
	readonly title: string;
	readonly hasRange: boolean;
	readonly subtitle: string;
	
}

export class RangeDescriptor implements ItemDescriptor {
	public readonly from: vscode.Position;
	public readonly to: vscode.Position;
	public readonly title: string;
	public readonly file: string;
	public readonly hoverInfo: string;
	public readonly subtitle: string;

	constructor (	fromLine: number, 
					fromCol: number, 
					toLine: number, 
					toCol: number, 
					title: string, 
					file: string,
					hoverInfo: string)  {
		this.from = new vscode.Position(fromLine-1, fromCol-1);
		this.to = new vscode.Position(toLine-1, toCol);
		this.title = title;
		this.file = file;
		this.hoverInfo = hoverInfo;
		this.subtitle = "";
	}
	public readonly hasRange = true;
}

export class NoPosDescriptor implements ItemDescriptor {
	public readonly title: string;
	public readonly subtitle: string;

	constructor (   title: string )  {
		this.title = title;
		this.subtitle = "No source file";
	}

	public readonly hasRange = false;
}


export type ResponseItem = {
	fromPosLn: number,
	fromPosCol: number,
	toPosLn: number,
	toPosCol: number,
	name: string,
	hoverInfo: string,
	file: string,
	noPos: boolean
}

export interface DataStorage { 
	updateData(data: any): void;
}