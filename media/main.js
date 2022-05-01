// @ts-nocheck
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

const vscode = acquireVsCodeApi();
const oldState = (vscode.getState());
const graphView = (document.getElementById('view-column'));

/* Form elements */
const funModsPlaceholders = document.querySelectorAll(".modOrFun");
const level = document.getElementById('depgraph-level');
const type = document.getElementById('depgraph-type');
const starting = document.getElementById('depgraph-start')
const exclude_otp = document.getElementById('exclude-otp') 

// Buttons
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

    console.log(exclude_otp)
    const graphParams = {
        type: type.value,
        level: level.value,
        starting_nodes: startingValue ? startingValue : [],
        exclude_otp: exclude_otp.checked
    }
    console.log(graphParams)

    vscode.postMessage({
        command: 'dependecyGraph',
        params: graphParams,
    })

    vscode.postMessage({
        command: 'formState',
        params: graphParams
    })
});

// Handle messages sent from the extension to the webview
window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
        case 'updateResponse':
            break;
        case 'printTextualGraph':
            console.log(message.graph);
            printTextualGraph(message.graph)
            break;
        case 'textualGraphError':
            graphView.innerHTML = "";
            let h2 = document.createElement('h2');
            h2.innerHTML = message.error;
            graphView.appendChild(h2);
        case 'setForm':            
            setForm(message.data);
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
    console.log("Set form:");
    console.log(formState)
    level.value = formState.level;
    type.value = formState.type;
    exclude_otp.checked = formState.exclude_otp
    let startVal = ""
    if (formState.starting_nodes.length == 1) {
        startVal = formState.starting_nodes[0];
    } 
    else if (formState.starting_nodes.length > 1) {
        startVal = separateContent(formState.starting_nodes)
    }
    starting.value = startVal;
    adjustLevelLabelsOnForm();
    
}


function separateContent(content) {
    let ret = ""
    for (let index = 0; index < content.length - 1; index++) {
        ret += content[index] + "; "
    }
    ret += content[content.length - 1]
    return ret
}

/* Init */
adjustLevelLabelsOnForm();
