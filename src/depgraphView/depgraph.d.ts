export type TextualGraph = {
	dependant: string,
	dependency: string
}

export type TextualGraphState = {
	type: string,
	level: string,
	starting_nodes: string[],
	exclude_otp: boolean,
	exclude: string[],
	exclude_lib: string[],
	connection: string[]
}
