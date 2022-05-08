import * as vscode from 'vscode';
import { CustomQueryProvider } from './customQuery';
import { NoPosDescriptor, RangeDescriptor } from './refactorErlTreeView';
import { DependencyGraphView } from './dependencyGraphView';
import { BuiltInQViewProvider } from './builtInQTreeView';
import { WebSocketHandler } from './webSocketHandler';

export class RefactorErlCommands {
	static setCommandForContext(context: vscode.ExtensionContext): void {
		const commands = [
			vscode.commands.registerCommand('variableView.goToLocation', (item: RangeDescriptor) => {
				BuiltInQViewProvider.selectTreeItem(item);
			}),

			vscode.commands.registerCommand('customQuery.noPosNotify', (item: NoPosDescriptor) => {
				vscode.window.showInformationMessage("Corresponding source file is not loaded");
			}),

			vscode.commands.registerCommand('customQuery.goToLocation', (item: RangeDescriptor) => {
				CustomQueryProvider.selectResultItem(item);
			}),

			vscode.commands.registerCommand('refactorErl.checkConnection', () => {
				WebSocketHandler.getInstance().checkConnection();
			}),

			vscode.commands.registerCommand('refactorErl.tryAgainConnect', () => {
				WebSocketHandler.getInstance().connectTryAgain();
			}),

			vscode.commands.registerCommand('refactorErl.dependencyGraph', (data) => {
				DependencyGraphView.createOrShow(context.extensionUri);
			}),

			vscode.commands.registerCommand('refactorErl.databaseSync', () => {
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: `Synchronisation started`,
					cancellable: false
				}, (progress) => {

					const response = WebSocketHandler.getInstance().request('databaseSync', '');
					response.then(
						(value) => {								
							if (value == "ok") {
								vscode.window.showInformationMessage(`Synchronisation finished`);
							}
							else if (value == "failed") {
								vscode.window.showErrorMessage(`Synchronisation failed`);
							}

							else if (value == "busy") {
								vscode.window.showErrorMessage(`Synchronisation is not possible, please try again later (another request is running!)`);
							}

							else {
								vscode.window.showErrorMessage(`Synchronisation failed due unkown reason.`);
							}

						},
						(error) => { vscode.window.showErrorMessage(`Synchronisation timeout`); }
					);

					return response;
				});
			}),

			vscode.commands.registerCommand('refactorErl.dynamicAnal', () => {
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: `Dynamic analysis started`,
					cancellable: false
				}, (progress) => {

					const response = WebSocketHandler.getInstance().request('dynamicAnal', '');
					response.then(
						(value) => {								
							if (value == "ok") {
								vscode.window.showInformationMessage(`Dynamic analysis finished`);
							}
							else if (value == "failed") {
								vscode.window.showErrorMessage(`Dynamic analysis failed`);
							}

							else if (value == "busy") {
								vscode.window.showErrorMessage(`Dynamic analysis is not possible, please try again later (another request is running!)`);
							}

							else {
								vscode.window.showErrorMessage(`Dynamic analysis failed due unkown reason.`);
							}

						},
						(error) => { vscode.window.showErrorMessage(`Dynamic analysis timeout`); }
					);

					return response;
				});
			}),

			vscode.commands.registerCommand('refactorErl.dynamicClear', () => {
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: `Clearing started`,
					cancellable: false
				}, (progress) => {

					const response = WebSocketHandler.getInstance().request('dynamicClear', '');
					response.then(
						(value) => {								
							if (value == "ok") {
								vscode.window.showInformationMessage(`Clearing finished`);
							}
							else if (value == "failed") {
								vscode.window.showErrorMessage(`Clearing failed`);
							}

							else if (value == "busy") {
								vscode.window.showErrorMessage(`Clearing is not possible, please try again later (another request is running!)`);
							}

							else {
								vscode.window.showErrorMessage(`Clearing failed due unkown reason.`);
							}

						},
						(error) => { vscode.window.showErrorMessage(`Clearing timeout`); }
					);

					return response;
				});
			})
			
		];

		for (const command of commands) {
			context.subscriptions.push(command);
		}
	}
}