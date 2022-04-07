import { WebSocket } from "ws";
import * as vscode from 'vscode';

export class WebSocketHandler {
	private static instance: WebSocketHandler;
	private socket: WebSocket;
	private socketOnline: boolean;
	private subs: Map<string, ((param: any) => void)[]>;
	private uri: string;

	private constructor() {
		this.socketOnline = false;
		this.subs = new Map<string, ((param: any) => void)[]>();
		this.uri = 'ws://127.0.0.1:8002/vsc_api.yaws';
		
		this.socket = new WebSocket(this.uri);
		this.connect();

	}

	public connect() {
		if (!this.socketOnline) {
			this.socket = new WebSocket(this.uri);
			this.socket.addEventListener('open', (event) => {
				this.socketOnline = true;
				vscode.commands.executeCommand('setContext', 'refactorErl.nodeReachable', this.socketOnline);
				this.socket.send('client-connected');

			});

			this.socket.onmessage = (eventStream) => {
				const streamObject = JSON.parse(String(eventStream.data));
				const event = streamObject.event;
				const data = streamObject.data;

				const subsFuns = this.subs.get(event);
				if (subsFuns != undefined && subsFuns.length > 0) {
					for (const fun of subsFuns) {
						fun(data);
					}
				}
			};

			this.subscribe("error", (data) => { vscode.window.showErrorMessage("Error: " + String(data)); });
		}
	}

	public static getInstance(): WebSocketHandler {
		if (!WebSocketHandler.instance) {
			WebSocketHandler.instance = new WebSocketHandler();
		}

		return WebSocketHandler.instance;
	}

	public subscribe(event: string, fun: (param: any) => void) {
		if (this.subs.has(event)) {
			this.subs.get(event)?.push(fun);
		}
		else {
			this.subs.set(event, [fun]);
		}

	}


}
