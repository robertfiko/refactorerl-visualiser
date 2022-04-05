import { WebSocket } from "ws";

/**
 * The Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
class WebSocketHandler {
	private static instance: WebSocketHandler;
	private socket: WebSocket;
	private socketOnline: boolean;

	private constructor() { //TODO: Handle if the browser is not supporting WS
		this.socketOnline = false;
		this.socket = new WebSocket('ws://127.0.0.1:8002/vsc_api.yaws');
		this.socket.addEventListener('open', function (event) {
			this.socketOnline = true;
			vscode.commands.executeCommand('setContext', 'refactorErl.nodeReachable', WebSocketOnline);
			socket.send('client-connected');

		});

		socket.onmessage = function (event) {
			if (typeof event.data === 'string' || event.data instanceof String) {
				vscode.window.showWarningMessage(String(event.data));
			}
		};
	}

	public static getInstance(): WebSocketHandler {
		if (!WebSocketHandler.instance) {
			WebSocketHandler.instance = new WebSocketHandler();
		}

		return WebSocketHandler.instance;
	}


}
