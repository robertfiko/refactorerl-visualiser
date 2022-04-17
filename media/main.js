// @ts-nocheck
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

const vscode = acquireVsCodeApi();
const oldState = (vscode.getState());
const refacState = (document.getElementById('refac'));
const graphView = (document.getElementById('view-column'));

/* Form elements */
const funModsPlaceholders = document.querySelectorAll(".modOrFun");

const level = (document.getElementById('depgraph-level'));
const type = (document.getElementById('depgraph-type'));
const generateButton = (document.getElementById('graph-properties-generate'));
const clearButton = (document.getElementById('clear'));

level.addEventListener('change', adjustLevelLabelsOnForm)


clearButton.addEventListener('click', () => {
    graphView.innerHTML = "";
})

generateButton.addEventListener('click', (event) => {
    
    

    console.log(level.value);
    console.log(type.value);

    const graphParams = {
        type: type.value,
        level: level.value
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
    }
});


function printTextualGraph(graph) {
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
    if (level.value == "function") {
        funModsPlaceholders.forEach((elem) => elem.innerHTML = "function")
    }
    else if (level.value == "module") {
        funModsPlaceholders.forEach((elem) => elem.innerHTML = "module")
    }
    else {
        funModsPlaceholders.forEach((elem) => elem.innerHTML = "{" + level.value + "}")
    }
}



/* Init */
adjustLevelLabelsOnForm();
