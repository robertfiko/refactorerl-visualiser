import { WebSocket } from "ws";
import * as vscode from 'vscode';
import { v4 } from 'uuid';

export class WebSocketHandler {
	private static instance: WebSocketHandler;
	private socket: WebSocket;
	private socketOnline: boolean;
	private subs: Map<string, ((param: any) => void)[]>;
	private reqIdsubs: Map<string, (param: any) => void>;
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
		this.reqIdsubs = new Map<string, ((param: any) => void)>();
		this.uri = 'ws://127.0.0.1:8002/vsc_api.yaws';

		this.socket = new WebSocket(this.uri);
		this.connect();
	}

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
						const reqId = streamObject.callbackId;
						if (reqId == "broadcast") {
							const event = streamObject.event;
							const data = streamObject.data;

							const subsFuns = this.subs.get(event);
							if (subsFuns != undefined && subsFuns.length > 0) {
								for (const fun of subsFuns) {
									fun(data);
								}
							}
						}

						else {
							const data = streamObject.data;
							const reqIdSubFun = this.reqIdsubs.get(reqId);
							if (reqIdSubFun) {
								reqIdSubFun(data);
								this.reqIdsubs.delete(reqId);
							}	
						}

					};

					this.subscribe("error", (data) => { vscode.window.showErrorMessage("Error: " + String(data)); });

				} catch (error) {
					reject(error);
				}
			}
			else if (this.socketOnline) {
				return WebSocketHandler.getInstance();
			}
		});

		return reponsePromise;
	}

	public async reConnect(): Promise<any> {
		await this.aliveCheck();
		if (this.socketOnline) {
			vscode.window.showInformationMessage(`Connected to RefactorErl via WS!`);
		}
		else {
			if (!this.tryingToConnect) {
				return vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: `Connecting to RefactorErl via WS...`,
				}, (progress, token) => {
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
	}

	public async aliveCheck(): Promise<boolean> {
		return await this.request("alive", "").then(
			(response) => {
				this.socketOnline = response == 'alive';
				return this.socketOnline;
			}
		);
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

	private addRequestHandler(reqId: string, fun: (param: any) => void) {
		if (this.reqIdsubs.has(reqId)) {
			vscode.window.showErrorMessage('Handling is already in progress for that request ID');
		}
		else {
			this.reqIdsubs.set(reqId, fun);
		}
	}
	
	/**
	 * Executes a type of request on the server trough WS
	 * @param requestType The type of request, which is recognised by the server.
	 * @param data The data which is sent to the server with type of request
	 * @returns Promise with the results, if resolved
	 */
	public async request(requestType: string, data: any): Promise<any> { 
		if (this.socketOnline) {
			try {
				const responsePromise = new Promise((resolve, reject) => {
					const reqId = v4();
					//Sending to WS
					const obj = {
						requestType: requestType,
						data: data,
						callbackId: reqId
					};
					this.socket.send(JSON.stringify(obj));
		
					let dataArrived = undefined;
					this.addRequestHandler(reqId, (data) => {
						dataArrived = data;
						resolve(dataArrived);
						clearTimeout(timeout);
					});
		
					const timeout = setTimeout(() => { reject("TIMEOUT"); }, WebSocketHandler.TIMEOUT);
				});
		
				return responsePromise;
			} catch (error) {
				this.reConnect();
				this.request(requestType, data); //TODO: introduce some recursive logics this could be heavy
			}
		}
		else {
			this.reConnect();
			this.request(requestType, data);
		}
		
	}


}
