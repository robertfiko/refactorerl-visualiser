/**
 * Common type definitions for the Extension backend and the Webview. 
 */

export type TextualGraph = {
	dependant: string,
	dependency: string
}

export type PathLike = string

export type GraphResponse =
	{
		status: "ok",
		data: PathLike,
		type: "svg"
	}
	|
	{
		status: "ok",
		data: TextualGraph[],
		type: "textual"
	}
	|
	{
		status: "failed",
		data: string,
	}


export type DependencyGraphState = {
	type: string,
	level: string,
	starting_nodes: string[],
	exclude_otp: boolean,
	exclude: string[],
	exclude_lib: string[],
	connection: string[],
	output_type: string
}
export type ExtensionMessageCommands = 'updateResponse' | 'printTextualGraph' | 'textualGraphError' | 'setForm' | 'svgGraphPath'

export type ExtensionMessageParam = {
	command: ExtensionMessageCommands,
	graph?: TextualGraph[],
	error?: string,
	data?: any,
	path?: PathLike
}

export type WebViewMessageCommands = 'dependencyGraph' | 'formState' | 'openSvg';


	export type WebViewMessageParam =
	{
		command: 'dependencyGraph',
		params: DependencyGraphState
	}
	|
	{
		command: 'formState',
		params: DependencyGraphState
	}
	|
	{
		command: 'openSvg',
		params: PathLike
	}


