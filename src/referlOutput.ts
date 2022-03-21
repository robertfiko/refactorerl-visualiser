import { Uri } from "vscode";
import * as vscode from 'vscode';
import * as fs from 'fs';



export class ReferlOutput {
	private exsits: boolean;
	private data: any;

	private updateJSON(): void {
		const JsonString = fs.readFileSync(this.uri.fsPath, 'utf8');
		this.data = JSON.parse(JsonString);
		vscode.window.showInformationMessage("JSON updated!");
	}

	private valid(): boolean {
		return this.data != undefined;
	}

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
	}

	public origins() {
		if (this.valid()) {
			return this.data.origins;
		}
		else {
			return [];
		}
	}
}