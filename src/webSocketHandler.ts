import { WebSocket } from "ws";
import * as vscode from 'vscode';
import { TIMEOUT } from "dns";
import { deflateSync } from "zlib";
import { PerformanceObserver } from "perf_hooks";

export class WebSocketHandler {
	private static instance: WebSocketHandler;
	private socket: WebSocket;
	private socketOnline: boolean;
	private subs: Map<string, ((param: any) => void)[]>;
	private uri: string;
	private vsOutput: vscode.OutputChannel;
	private tryingToConnect;
	private runningPromise: Promise<any> | undefined;

	private static TIMEOUT = 3000; //ms

	private constructor() {
		this.vsOutput = vscode.window.createOutputChannel('RefactorErl WS');
		this.vsOutput.show();
		this.socketOnline = false;
		this.tryingToConnect = false;
		this.runningPromise = undefined;
		this.subs = new Map<string, ((param: any) => void)[]>();
		this.uri = 'ws://127.0.0.1:8002/vsc_api.yaws';

		this.socket = new WebSocket(this.uri);
		this.connect();
	}

	/*public isCurrentlyConnection(): boolean {
		return this.tryingToConnect;
	} */

	public async connect(): Promise<any> {
		const reponsePromise = new Promise<any>((resolve, reject) => {
			if (this.tryingToConnect) {
				if (this.runningPromise) return this.runningPromise;
				else reject("Internal state error");
			}
			else if (!this.tryingToConnect && !this.socketOnline) {
				//CONNECT
				try {
					this.tryingToConnect = true;
					this.socket = new WebSocket(this.uri);
					const timeout = setTimeout(() => { this.tryingToConnect = false; reject("TIMEOUT"); }, WebSocketHandler.TIMEOUT);
					this.socket.addEventListener('open', (event) => {
						this.socket.send('client-connected');

						clearTimeout(timeout);
						this.socketOnline = true;
						//this.runningPromise = undefined;
						this.tryingToConnect = false;
						vscode.commands.executeCommand('setContext', 'refactorErl.nodeReachable', this.socketOnline);

						resolve(WebSocketHandler.getInstance());
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

				} catch (error) {
					reject(error);
				}
			}
			else if (this.socketOnline) {
				return Promise.resolve("WebSocketHandler.getInstance()");
				//TODO: CHECK connection
				//TODO: when called on living connection the promise doesn't get rersolved somehwy :/ 
			}
		});

		return reponsePromise;
	}

	public async reConnect(): Promise<any> {
		if (!this.tryingToConnect) {
			return vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Connecting to RefactorErl via WS...`,
				cancellable: false
			}, (progress) => {
				const response = WebSocketHandler.getInstance().connect();
				response.then(
					(value) => {
						progress.report({ increment: 100, });
						vscode.window.showInformationMessage(`Connected to RefactorErl via WS!`);
					},
					(error) => {
						vscode.window.showErrorMessage(`Cannot conenct to RefactorErl via WS.`);
					}
				);

				return response;
			});
		}
		else {
			return this.runningPromise;
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

	public async request(requestType: string, data: any): Promise<any> { //TODO: uniqe request type or id or something to not overloead the handlers and indentify where to send the response
		const responsePromise = new Promise((resolve, reject) => {
			this.send(requestType, data);
			const responseEvent = requestType + "_response";
			let dataArrived = undefined;
			this.subscribe(responseEvent, (data) => {
				dataArrived = data;
				resolve(dataArrived);
				clearTimeout(timeout);
			});

			const timeout = setTimeout(() => { reject("TIMEOUT"); }, WebSocketHandler.TIMEOUT);
		});

		return responsePromise;
	}


}
