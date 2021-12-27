const sleepModeButton = document.getElementById("sleepMode")
window.onload = () => {
    chrome.storage.sync.get({sleepMode : false}, (result) => {
        sleepModeButton.checked = result.sleepMode;
    })

    sleepModeButton.onclick = function(){
        chrome.storage.sync.set({sleepMode: sleepModeButton.checked})
        console.log("set");
        chrome.storage.sync.get({sleepMode: false}, function (result) {
            console.log(result.sleepMode)
        })
    }
}
