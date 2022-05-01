import { WebSocket } from "ws";
import * as vscode from 'vscode';
import { v4 } from 'uuid';
import { rejects } from "assert";

export class WebSocketHandler {
	private static instance: WebSocketHandler;
	private socket!: WebSocket;
	private subs: Map<string, ((param: any) => void)[]>;
	private reqIdsubs: Map<string, (param: any) => void>;
	private uri: string;
	private vsOutput: vscode.OutputChannel;
	private tryingToConnect;
	private runningPromise: Promise<any> | undefined;

	private _socketConnected: boolean;

	private static TIMEOUT = 3000; //ms

	private constructor() {
		this._socketConnected = false;
		this.vsOutput = vscode.window.createOutputChannel('RefactorErl WS');
		this.vsOutput.show();
		this.tryingToConnect = false;
		this.runningPromise = undefined;
		this.subs = new Map<string, ((param: any) => void)[]>();
		this.reqIdsubs = new Map<string, ((param: any) => void)>();
		this.uri = 'ws://127.0.0.1:8002/vsc_api.yaws';

		//this.socket = new WebSocket(this.uri); //todo: this creates a second WS
		this.connect();
	}

	private set socketConnected(value: boolean) {
		this._socketConnected = value;
		vscode.commands.executeCommand('setContext', 'refactorErl.nodeReachable', this._socketConnected);
	}

	private get socketConnected() {
		return this._socketConnected;
	}

	/**
	 * Establishes a connection to the server.
	 * @returns A Promise object. If resolved it contains the instance
	 * if rejected a cause of rejection
	 */
	public async connect(): Promise<any> {
		const reponsePromise = new Promise<any>((resolve, reject) => {
			if (this.tryingToConnect) {
				if (this.runningPromise) return this.runningPromise;
				else reject("Internal state error");
			}
			else if (!this.tryingToConnect && !this.socketConnected) {
				//CONNECT
				try {
					this.tryingToConnect = true;
					this.socket = new WebSocket(this.uri);
					const timeout = setTimeout(() => { this.tryingToConnect = false; reject("SOCKET_CONNECTION_TIMEOUT"); }, WebSocketHandler.TIMEOUT);
					this.socket.addEventListener('open', (event) => {
						this.socket.send('client-connected');

						clearTimeout(timeout);
						this.socketConnected = true;
						this.tryingToConnect = false;

						resolve(WebSocketHandler.getInstance());
					});

					this.socket.onclose = (eventStream) => {
						this.socketConnected = false;
					};

					//MESSAGE HANDLING
					this.socket.onmessage = (eventStream) => {
						const streamObject = JSON.parse(String(eventStream.data));
						const reqId = streamObject.callbackId;
						const event = streamObject.event;
						if (event != undefined && reqId == undefined) {
							const event = streamObject.event;
							const data = streamObject.data;

							const subsFuns = this.subs.get(event);
							if (subsFuns != undefined && subsFuns.length > 0) {
								for (const fun of subsFuns) {
									fun(data);
								}
							}
						}

						else if (event == undefined && reqId != undefined) {
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
			else if (this.socketConnected) {
				return WebSocketHandler.getInstance();
			}
		});

		return reponsePromise;
	}

	/**
	 * Tries to establish a connection with the server. This is possibly called
	 * from the UI, so this is equipped with interactive elements.
	 * Can be called if the WS is alive, or not.
	 * @returns The Promise of the connection. If resolved it is an instance
	 * if rejected the casue of rejection.
	 */
	public async connectTryAgain(): Promise<any> {
		const script = (): Thenable<any> | undefined => {
			if (!this.tryingToConnect) {
				return vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: `Connecting to RefactorErl via WS...`,
				}, (progress) => {
					const response = WebSocketHandler.getInstance().connect();
					response.then(
						(value) => {
							progress.report({ increment: 100, });
							vscode.window.showInformationMessage(`Connected to RefactorErl via WS!`);
						},
						(error) => {
							progress.report({ increment: 100, });
							vscode.window.showErrorMessage(`Cannot connect to RefactorErl via WS.`);
						}
					);
					return response;
				});
			}
			else {
				return this.runningPromise;
			}
		};

		if (this.socketConnected) {
			const alive = await this.aliveCheck();
			if (alive) {
				vscode.window.showInformationMessage(`Connected to RefactorErl via WS!`);
			}
			else {
				return script();
			}

		}
		else {
			return script();
		}
	}

	/**
	 * Checks the connection with the server. This is possibly called
	 * from the UI, so this is equipped with interactive elements.
	 * @returns The Promise of the connection. If resolved it is an instance
	 * if rejected the casue of rejection
	 */
	public async checkConnection(): Promise<boolean> {
		if (this.socketConnected) {
			return vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Checking connection with RefactorErl...`,
			}, (progress) => {
				const response = this.aliveCheck();
				response.then(
					(value) => {
						if (value) {
							progress.report({ increment: 100 });
							vscode.window.showInformationMessage("Connected to RefactorErl via WS!");
						}
						else {
							progress.report({ increment: 100 });
							vscode.window.showInformationMessage("Cannot connect to RefactorErl via WS.");
						}
					},
					(error) => {
						vscode.window.showErrorMessage(`Cannot connect to RefactorErl via WS.`);
					}
				);
				return response;
			});
		}
		else {
			await this.connectTryAgain();
			return await this.aliveCheck();
		}
	}

	/**
	 * Checks if the connection is alive, by sending an alive request
	 * @returns The state of the connection.
	 */
	public async aliveCheck(): Promise<boolean> {
		const script = async () => {
			return await this.request("alive", "").then(
				(response) => {
					this.socketConnected = response == 'alive';
					return this.socketConnected;
				},
				(rejectedResp) => {
					return false;
				}
			);
		};
		if (this.socketConnected) {
			return script();
		}
		else {
			// If socket is not alive, try to connect to it, then execute
			this.connect();
			if (this.socketConnected) {
				return script();
			}
			else {
				return false;
			}


		}

	}

	/**
	 * Get the handler instance (singleton)
	 * @returns The one and only instance of the handler
	 */
	public static getInstance(): WebSocketHandler {
		if (!WebSocketHandler.instance) {
			WebSocketHandler.instance = new WebSocketHandler();
		}

		return WebSocketHandler.instance;
	}

	/**
	 * Subscribes a handler function to an event
	 * @param event Event for subscribtion
	 * @param fun Handler function
	 */
	public subscribe(event: string, fun: (param: any) => void) {
		if (this.subs.has(event)) {
			this.subs.get(event)?.push(fun);
		}
		else {
			this.subs.set(event, [fun]);
		}
	}

	/**
	 * Assigns a handler function for a Callback ID. When the response is
	 * arrived from the server it will arrive back with the same ID.
	 * @param reqId Request ID / Callback ID which is associated with the request
	 * @param fun Handler function
	 */
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
		const script = () => {
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
				return Promise.reject("Error while sending to socket.");
			}
		};

		if (this.socketConnected) {
			return script();
		}
		else {
			const response = WebSocketHandler.getInstance().connect();
			response.then(
				(value) => {
					if (this.socketConnected) {
						return script();
					}
					else {
						return Promise.reject("Not connected to socket");
					}
				},
				(error) => {
					return Promise.reject("Not connected to socket");
				}
			);
			
		}

	}


}
