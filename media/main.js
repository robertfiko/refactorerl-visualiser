// @ts-nocheck
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

const vscode = acquireVsCodeApi();
const oldState = (vscode.getState());
const refacState = (document.getElementById('refac'));
const graphView = (document.getElementById('view-column'));

/* Form elements */
const funModsPlaceholders = document.querySelectorAll(".modOrFun");

const level = document.getElementById('depgraph-level');
const type = document.getElementById('depgraph-type');
const starting = document.getElementById('depgraph-start')

const generateButton = (document.getElementById('graph-properties-generate'));
const clearButton = (document.getElementById('clear'));

level.addEventListener('change', adjustLevelLabelsOnForm)


clearButton.addEventListener('click', () => {
    graphView.innerHTML = "";
})

generateButton.addEventListener('click', (event) => {
    let startingValue = undefined;
    if (starting.value != "") {
        let startingArr = starting.value.split(';');
        for (let i = 0; i < startingArr.length; i++) {
            startingArr[i] = startingArr[i].trim();
        }
        console.log(startingArr)
        startingValue = startingArr;
    }

    const graphParams = {
        type: type.value,
        level: level.value,
        starting_nodes: startingValue
    }

    vscode.postMessage({
        command: 'dependecyGraph',
        params: graphParams,
    })
});

// Handle messages sent from the extension to the webview
window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
        case 'updateResponse':
            break;
        case 'printTextualGraph':
            printTextualGraph(message.graph)
            break;
        case 'textualGraphError':
            graphView.innerHTML = "";
            let h2 = document.createElement('h2');
            h2.innerHTML = message.error;
            graphView.appendChild(h2);
        case 'setForm':
            console.log(message.data);
            const formRaw = message.data;
            const formState = {
                level: formRaw.level,
                type: formRaw.type,
                starting_nodes: [formRaw.starting_nodes]
            }
            console.log(formState)
            setForm(formState);

            //TODO send back form state for saving GOT STATE??
            break;
    }
});


function printTextualGraph(graph) {
    console.log(graph)
    graphView.innerHTML = "";
    for (const elem of graph) {
        let content = elem.dependant + " -> "
        if (elem.dependency.length > 0) {
            content += " [ ";
            for (let i = 0; i < elem.dependency.length; i++) {
                content += elem.dependency[i];
                if (i < elem.dependency.length - 1) {
                    content += ", "
                }
                else {
                    content += " ] "
                }
            }

        }
        else {
            content += "[]"
        }

        let p = document.createElement('p');
        p.classList.add("dependency-element")
        p.innerHTML = content
        graphView.appendChild(p)
    }
}

function adjustLevelLabelsOnForm() {
    if (level.value == "func") {
        funModsPlaceholders.forEach((elem) => elem.innerHTML = "functions")
    }
    else if (level.value == "mod") {
        funModsPlaceholders.forEach((elem) => elem.innerHTML = "modules")
    }
    else {
        funModsPlaceholders.forEach((elem) => elem.innerHTML = "{" + level.value + "}")
    }
}

function setForm(formState) {
    console.log(formState)
    level.value = formState.level;
    type.value = formState.type;
    let startVal = ""
    if (formState.starting_nodes.length == 1) {
        startVal = formState.starting_nodes[0];
    } 
    else if (formState.starting_nodes.length > 1) {
        startVal = "TODO" 
    }
    starting.value = startVal;
    adjustLevelLabelsOnForm();
    
}



/* Init */
adjustLevelLabelsOnForm();
