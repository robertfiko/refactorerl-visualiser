import * as vscode from 'vscode';
import * as path from 'path';
import { Data } from 'ws';
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
		vscode.commands.executeCommand('vscode.open', uri);

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const range = new vscode.Range(rangeDescriptor.from, rangeDescriptor.to);

			const deco = { range: range, hoverMessage: message };
			activeEditor.setDecorations(decoration, [deco]);
			activeEditor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);

			const newSelection = new vscode.Selection(rangeDescriptor.from, rangeDescriptor.from);
			activeEditor.selection = newSelection;
		}
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
	constructor(
		public readonly title: string,
		public readonly command: string,
		origin: RangeDescriptor
	) {
		this.arguments = [origin];
	}
	tooltip?: string | undefined;
	arguments?: any[] | undefined;
}

export class RangeDescriptor {
	public readonly from: vscode.Position;
	public readonly to: vscode.Position;
	public readonly value: string;
	public readonly file: string;

	constructor (raw: [number, number, number, number, string], file: string)  {
		this.from = new vscode.Position(raw[0]-1, raw[1]-1);
		this.to = new vscode.Position(raw[2]-1, raw[3]);
		this.value = raw[4];
		this.file = file;
	}

}

export interface DataStorage { 
	updateData(data: any): void;


}