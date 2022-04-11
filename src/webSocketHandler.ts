import { WebSocket } from "ws";
import * as vscode from 'vscode';
import { TIMEOUT } from "dns";
import { deflateSync } from "zlib";

export class WebSocketHandler {
	private static instance: WebSocketHandler;
	private socket: WebSocket;
	private socketOnline: boolean;
	private subs: Map<string, ((param: any) => void)[]>;
	private uri: string;
	private vsOutput: vscode.OutputChannel;

	private static TIMEOUT = 3000; //ms

	private constructor() {
		this.vsOutput = vscode.window.createOutputChannel('RefactorErl WS');
		this.vsOutput.show();
		this.socketOnline = false;
		this.subs = new Map<string, ((param: any) => void)[]>();
		this.uri = 'ws://127.0.0.1:8002/vsc_api.yaws';

		this.socket = new WebSocket(this.uri);
		this.connect();

	}

	/*public isOnline(): boolean {
		return this.socketOnline;
	}*/

	public connect(callback: (() => void) | undefined = undefined) {
		if (!this.socketOnline) {
			this.socket = new WebSocket(this.uri);
			this.socket.addEventListener('open', (event) => {
				this.socketOnline = true;
				vscode.commands.executeCommand('setContext', 'refactorErl.nodeReachable', this.socketOnline);
				this.socket.send('client-connected');

				if (callback) {
					callback();
				}

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

	private send(request: string, data: any) {
		const obj = {
			requestType: request,
			data: data
		};
		this.socket.send(JSON.stringify(obj));
	}

	public async request(request: string, data: any): Promise<any> {
		const responsePromise = new Promise((resolve, reject) => {
			this.send(request, data);
			const responseEvent = request + "_response";
			let dataArrived = undefined;
			this.subscribe(responseEvent, (data) => {
				dataArrived = data;
				resolve(dataArrived);
				clearTimeout(timeout);
			});

			const timeout = setTimeout(() => {reject("TIMEOUT");}, WebSocketHandler.TIMEOUT);
		});

		return responsePromise;
	}


}
