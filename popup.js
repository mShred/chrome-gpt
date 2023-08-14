document.addEventListener("DOMContentLoaded", async () => {

    const sleep = ms => new Promise(r => setTimeout(r, ms))

    const getActiveTab = async () => {
        const tabs = await chrome.tabs.query({
            currentWindow: true,
            active: true
        })
        return tabs[0]
    }

    const showPopup = async (answer) => {
        if (answer !== "CLOUDFLARE" && answer !== "ERROR") {
            try {
                let res = await answer.split("data:")
                try {
                    const detail = JSON.parse(res[0]).detail
                    document.getElementById('output').style.opacity = 1
                    document.getElementById('output').innerHTML = detail
                    return;
                } catch (e) {
                    try {
                        res = res[1].trim()
                        if (res === "[DONE]") return
                        answer = JSON.parse(res)
                        let final = answer.message.content.parts[0]
                        final = final.replace(/\n/g,'<br>')
                        document.getElementById('output').style.opacity = 1
                        document.getElementById('output').innerHTML = final
                    } catch (e) {}
                }
            } catch (e) {
                document.getElementById('output').style.opacity = 1
                document.getElementById('output').innerHTML = "Something went wrong. Please try in a few minutes."
            }

        } else if (answer === "CLOUDFLARE") {
            document.getElementById('input').style.opacity = 1
            document.getElementById('input').innerHTML = 'You need to once visit <a target="_blank" href="https://chat.openai.com/chat">chat.openai.com</a> and check if the connection is secure. Redirecting...'
            await sleep(3000)
            chrome.tabs.create({url: "https://chat.openai.com/chat"})
        } else {
            document.getElementById('output').style.opacity = 1
            document.getElementById('output').innerHTML = 'Something went wrong. Are you logged in to <a target="_blank" href="https://chat.openai.com/chat">chat.openai.com</a>? Try logging out and logging in again.'
        }
    }

    const getData = async (selection) => {
        if (!selection.length == 0) {

            document.getElementById('input').style.opacity = 1
            document.getElementById('input').innerHTML = selection
            document.getElementById('output').style.opacity = 0.5
            document.getElementById('output').innerHTML = "Loading..."

            const prepended_text = document.getElementById("input_prepend").innerText 

            const port = chrome.runtime.connect();
            port.postMessage({question: selection, prepended_text: prepended_text})
            port.onMessage.addListener((msg) => showPopup(msg))
        } else {
            document.getElementById('input').style.opacity = 0.5
            document.getElementById('input').innerHTML = "You have to first select some text"
        }
    }

    const getSelectedText = async () => {
        const activeTab = await getActiveTab()
        chrome.tabs.sendMessage(activeTab.id, {type: "LOAD"}, getData)
    }

    var inputElement = document.getElementById("input_prepend");
    // Listen for changes to the input element
    inputElement.addEventListener("input", function(event) {
    // Save the string to local storage
        chrome.storage.local.set({prepend_message: event.target.innerText})
    });

    // set Input value from local storage
    chrome.storage.local.get(["prepend_message"]).then((result) => {
        inputElement.innerText = result.prepend_message
    })

    getSelectedText()

    var copyButton = document.getElementById("copy_button");
    copyButton.addEventListener("click", function() {
        var inputElement = document.getElementById("output");
        navigator.clipboard.writeText(inputElement.innerText);
    });

    var sendButton = document.getElementById("send_button");
    sendButton.addEventListener("click", function() {
        getSelectedText()
    });
    
})