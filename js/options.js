let green = "#22aa22"
let red = "#aa2222"
let page = document.getElementById('buttonDiv');
const all_engines = ['Google', 'Bing', 'TinEye', 'Yandex', 'IQDB'];
function constructOptions(engines) {
    for (let item of engines) {
        let button = document.createElement('button');
        getColor(button, item);
        button.innerHTML = item;
        button.addEventListener('click', function() {
            chrome.storage.sync.get(['engines'], function(result) {
                console.log(result);
                if (result.engines !== undefined && result.engines.indexOf(item) >= 0) {
                    result.engines.splice(result.engines.indexOf(item), 1);
                    chrome.storage.sync.set({engines: result.engines}, function() {
                        console.log("removed " + item + " list is now " + result.engines);
                    })
                    button.style.backgroundColor = red;
                } else {
                    let new_store = [item]
                    if (result.engines !== undefined) {
                        new_store = new_store.concat(result.engines)
                    }
                    chrome.storage.sync.set({engines: new_store}, function() {
                        console.log("added " + item + " list is now " + new_store);
                    })
                    button.style.backgroundColor = green;
                }
            })
        });
        page.appendChild(button);
    }

}

function getColor(button, engine) {
    chrome.storage.sync.get(['engines'], function(result) {
        if (result.engines !== undefined && result.engines.indexOf(engine) >= 0) {
            button.style.backgroundColor = green;
        } else {
            button.style.backgroundColor = red;
        }
    });
}

function constructKey() {
    console.log("constructing cancel key")
    let d = document.getElementById("cancelKey");
    chrome.storage.sync.get(["cancelKeyCode"], function(result) {
        if (result.cancelKeyCode !== undefined) {
            d.innerHTML = charCodeToString(result.cancelKeyCode);
        } else {
            d.innerHTML = "Not set";
        }
    });
    d.addEventListener("click", waitForKey);
}

function waitForKey(e) {
    document.addEventListener("keydown", setCancelKey);
}

function setCancelKey(e) {
    console.log(e.keyCode);
    chrome.storage.sync.set({cancelKeyCode: e.keyCode}, function() {
        let d = document.getElementById("cancelKey");
        d.innerHTML = charCodeToString(e.keyCode);
    })
    document.removeEventListener("keydown", setCancelKey);
}

window.addEventListener("load", function() {
    page = document.getElementById('buttonDiv');
    constructOptions(all_engines);
    constructKey();
});


