// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    const oldState = /** @type {{ count: number} | undefined} */ (vscode.getState());

    const counter = /** @type {HTMLElement} */ (document.getElementById('lines-of-code-counter'));
    const refacState = /** @type {HTMLElement} */ (document.getElementById('refac'));
    const wsState = /** @type {HTMLElement} */ (document.getElementById('refac'));

    console.log('Initial state', oldState);

    let currentCount = (oldState && oldState.count) || 0;
    counter.textContent = `${currentCount}`;

    /*setInterval(() => {
        counter.textContent = `aa+${currentCount++} `;

        // Update state
        vscode.setState({ count: currentCount });

        

        // Alert the extension when the cat introduces a bug
        if (Math.random() < Math.min(0.001 * currentCount, 0.05)) {
            // Send a message back to the extension
            vscode.postMessage({
                command: 'alert',
                text: '🐛  on line ' + currentCount
            });
        }
    }, 100);*/

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        refacState.textContent = "YES REFAC";
        switch (message.command) {
            case 'refactor':
                currentCount = Math.ceil(currentCount * 0.5);
                counter.textContent = `${currentCount}`;
                break;
            case 'updateResponse':
                const LINE = 0
                const COL = 1
                const VAL = 2

                const data = message.data;
                const prefix = "vscode://file//" + data.file;
                const origins = data.origins;

                for (const origin of origins) {
                    let p = document.createElement('p')
                    let a = document.createElement('a')
                    a.href = prefix + ':' + origin[LINE] + ':' + origin[COL]
                    a.innerHTML = a.href + " ~ Possible value: " + origin[VAL]

                    p.appendChild(a)


                    refacState.appendChild(p)
                }

                //refacState.textContent = "hello";
                break;
        }
    });

    let supportsWebSockets = 'WebSocket' in window || 'MozWebSocket' in window;
    wsState.innerHTML = "Web socket support: " + supportsWebSockets

}());
