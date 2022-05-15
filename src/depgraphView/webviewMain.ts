// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

import { TextualGraph, DependencyGraphState, ExtensionMessageCommands, ExtensionMessageParam, WebViewMessageParam, WebViewMessageCommands } from "./depgraph";

const vscode = acquireVsCodeApi();
const oldState = (vscode.getState());
const graphView = (document.getElementById('view-column')) as HTMLElement;

//
// DOM ELEMENTS
//
/* Form elements */
const funModsPlaceholders = document.querySelectorAll(".modOrFun");
const level = document.getElementById('depgraph-level') as HTMLSelectElement;
const type = document.getElementById('depgraph-type') as HTMLSelectElement;
const starting = document.getElementById('depgraph-start') as HTMLInputElement;
const connection = document.getElementById('depgraph-connection') as HTMLInputElement;
const excluded = document.getElementById('depgraph-excluded') as HTMLInputElement;
const exclude_otp = document.getElementById('exclude-otp') as HTMLInputElement;
const excludedLib = document.getElementById('depgraph-excludedlib') as HTMLInputElement;
const outputType = document.getElementById('depgraph-output') as HTMLSelectElement;

/* Buttons */
const generateButton = (document.getElementById('graph-properties-generate')) as HTMLButtonElement;
const clearButton = (document.getElementById('clear')) as HTMLButtonElement;

//
// UTILITY FUNCTIONS
//

/**
 * Given a string value separated by semicolons, converts to an array,
 * trimes the extra whitespaces
 * @param {string} value 
 * @returns {string[]}
 */
function semicolonSeparatedToArray(value: string) {
    let returnValue: string[] = [];
    if (value != "") {
        const arr = value.split(';');
        for (let i = 0; i < arr.length; i++) {
            arr[i] = arr[i].trim();
        }
        returnValue = arr;
    }
    return returnValue;
}

function postMessage(param: WebViewMessageParam) {
    vscode.postMessage(param);
}

function sendGraphRequest(event: MouseEvent) {
    const startingValue = semicolonSeparatedToArray(starting.value);
    const excludeValue = semicolonSeparatedToArray(excluded.value);
    const excludeLibValue = semicolonSeparatedToArray(excludedLib.value);
    const connectionValue = semicolonSeparatedToArray(connection.value);

    console.log(exclude_otp);
    const graphParams: DependencyGraphState = {
        type: type.value,
        level: level.value,
        starting_nodes: startingValue,
        exclude_otp: exclude_otp.checked,
        exclude: excludeValue,
        exclude_lib: excludeLibValue,
        connection: connectionValue,
        output_type: outputType.value
    };

    postMessage({
        command: 'dependencyGraph',
        params: graphParams,
    });

    postMessage({
        command: 'formState',
        params: graphParams
    });
}

function handleExtensionMessages(event: MessageEvent) {
    const message = event.data as ExtensionMessageParam; // The json data that the extension sent
    switch (message.command as ExtensionMessageCommands) {
        case 'updateResponse': {
            break;
        }

        case 'printTextualGraph': {
            console.log(message.graph);
            printTextualGraph(message.graph);
            break;
        }

        case 'textualGraphError': {
            graphView.innerHTML = "";
            const h2 = document.createElement('h2');
            h2.innerHTML = message.error;
            graphView.appendChild(h2);
            break;
        }
        case 'setForm': {
            console.log(message.data);
            setForm(message.data);
            break;
        }

        case 'svgGraphPath': {
            graphView.innerHTML = "";
            const h2 = document.createElement('h3');
            h2.innerHTML = "Graph is already generated for this request. Click the button below to open it.";

            const button = document.createElement('button');
            button.innerHTML = "Open Graph";
            button.addEventListener('click', () => {
                postMessage({
                    command: 'openSvg',
                    params: message.path,
                });
            });

            const small = document.createElement('small');
            small.innerHTML = message.path;

            graphView.appendChild(h2);
            graphView.appendChild(document.createElement('br'));
            graphView.appendChild(button);
            graphView.appendChild(document.createElement('br'));
            graphView.appendChild(small);
        }

    }
}

function clearGraph(event: MouseEvent) {
    graphView.innerHTML = "";
}

function printTextualGraph(graph: TextualGraph[]) {
    console.log(graph);
    graphView.innerHTML = "";
    for (const elem of graph) {
        let content = elem.dependant + " -> ";
        if (elem.dependency.length > 0) {
            content += " [ ";
            for (let i = 0; i < elem.dependency.length; i++) {
                content += elem.dependency[i];
                if (i < elem.dependency.length - 1) {
                    content += ", ";
                }
                else {
                    content += " ] ";
                }
            }

        }
        else {
            content += "[]";
        }

        const p = document.createElement('p');
        p.classList.add("dependency-element");
        p.innerHTML = content;
        graphView.appendChild(p);
    }
}

function adjustLevelLabelsOnForm() {
    if (level.value == "func") {
        funModsPlaceholders.forEach((elem) => elem.innerHTML = "functions");
    }
    else if (level.value == "mod") {
        funModsPlaceholders.forEach((elem) => elem.innerHTML = "modules");
    }
    else {
        funModsPlaceholders.forEach((elem) => elem.innerHTML = "{" + level.value + "}");
    }
}

function setForm(formState: DependencyGraphState) {
    level.value = formState.level;
    type.value = formState.type;
    exclude_otp.checked = formState.exclude_otp;
    starting.value = separateContent(formState.starting_nodes);
    excluded.value = separateContent(formState.exclude);
    excludedLib.value = separateContent(formState.exclude_lib);
    connection.value = separateContent(formState.connection);
    outputType.value = formState.output_type;

    adjustLevelLabelsOnForm();
}

function separateContent(content: string[]): string {
    let ret = "";
    if (content.length >= 1 ) {
        for (let index = 0; index < content.length - 1; index++) {
            ret += content[index] + "; ";
        }
        ret += content[content.length - 1];
    }
    
    return ret;
}

//
// MAIN PART
//

level.addEventListener('change', adjustLevelLabelsOnForm);
clearButton.addEventListener('click', clearGraph);
generateButton.addEventListener('click', sendGraphRequest);
window.addEventListener('message', handleExtensionMessages);

adjustLevelLabelsOnForm();
graphView.innerHTML = "";
