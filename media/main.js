// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

const vscode = acquireVsCodeApi();
const oldState = /** @type {{ count: number} | undefined} */ (vscode.getState());
const refacState = /** @type {HTMLElement} */ (document.getElementById('refac'));
const graphView = /** @type {HTMLElement} */ (document.getElementById('view-column'));

// Handle messages sent from the extension to the webview
window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
        case 'refactor':
            refacState.textContent = "YES REFAC";
            break;
        case 'updateResponse':


            break;
        case 'printTextualGraph':
            const graph = message.graph
            for (const elem of graph) {
                console.log(elem)
                
                let content = elem.dependant + " -> "
                
                

                if (elem.dependency.length > 0) {
                    content += " [ ";
                    for(let i = 0; i < elem.dependency.length; i++) {
                        content += elem.dependency[i];
                        if (i < elem.dependency.length-1) {
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
            break;
    }
});

