
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
	data: TextualGraph,
	type: "textual" 
} 
	|
{
	status: "error",
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


