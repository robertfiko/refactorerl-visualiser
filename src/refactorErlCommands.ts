import * as vscode from 'vscode';
import { CustomQueryProvider } from './customQuery';
import { NoPosDescriptor, RangeDescriptor } from './refactorErlTreeView';
import { DependencyGraphView } from './dependencyGraphView';
import { VariableViewProvider } from './variableTreeView';
import { WebSocketHandler } from './webSocketHandler';

export class RefactorErlCommands {
	static setCommandForContext(context: vscode.ExtensionContext): void {
		const commands = [
			vscode.commands.registerCommand('variableView.goToLocation', (item: RangeDescriptor) => {
				VariableViewProvider.selectTreeItem(item);
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
				vscode.window.showInformationMessage("SYNC");
				const uri = vscode.Uri.file("/Users/fikorobert/Projects/referl_svn/fiko/tool/data/referl@fikoMac-1651_916823_85418_vscode_graph.svg");
				vscode.commands.executeCommand('_svg.showSvgByUri', uri);
			})
			
		];

		for (const command of commands) {
			context.subscriptions.push(command);
		}
	}
}