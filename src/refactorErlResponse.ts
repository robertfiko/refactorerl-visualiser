import { Uri } from "vscode";
import * as vscode from 'vscode';
import * as fs from 'fs';


export class RefactorErlResponse {
	private exsits: boolean;
	private data: any;
	private callOnUpdateJSON: (() => void)[];
	//private updateJsonEvent: EventTarget;

	constructor(private uri: Uri) {
		const watcher = vscode.workspace.createFileSystemWatcher(uri.fsPath);
		this.exsits = false;
		try {
			vscode.workspace.fs.stat(uri);
			this.exsits = true;
			this.updateJSON();
		} catch {
			watcher.onDidCreate(() => {
				this.updateJSON();
			});
		}

		watcher.onDidChange(() => {
			this.updateJSON();
		});

		this.callOnUpdateJSON = [];
	}

	private updateJSON(): void {
		const JsonString = fs.readFileSync(this.uri.fsPath, 'utf8');
		this.data = JSON.parse(JsonString);
		vscode.window.showInformationMessage("JSON updated!");
		for (const fun of this.callOnUpdateJSON) {
			//fun();
			//vscode.window.showInformationMessage("1!");
		}
	}

	public subscribeToUpdateJSON(fun: () => void) {
		this.callOnUpdateJSON.push(fun);
	}

	private valid(): boolean {
		return this.data != undefined;
	}

	public origins(): ReferlOriginDescriptor[] {
		if (this.valid()) {
			const origins: ReferlOriginDescriptor[] = [];
			for (const rawOrigin of this.data.origins) {
				origins.push(new ReferlOriginDescriptor(rawOrigin, this.file()));
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
}


export class ReferlOriginDescriptor {
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


/*

origins,
file

*/