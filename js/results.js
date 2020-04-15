let page = document.getElementById('iframeDiv');
const test = "https://www.gstatic.com/tv/thumb/persons/1366/1366_v9_bc.jpg"
function displayResults(image) {
    chrome.storage.sync.get(['engines'], function(result) {
        if (result.engines === undefined) {
            let scold = document.createElement('p');
            scold.text = "It seems you haven't enabled any search engines, go to options to enable some."
            page.appendChild(scold);
            return;
        }
        result.engines.sort();
        for (let item of result.engines) {
            let iframe = document.createElement('iframe');
            if (item == "Google") {
                iframe.src = "https://images.google.com/searchbyimage?image_url=" + image;
            } else if (item == "Bing") {
                iframe.src = "https://www.bing.com/images/search?q=imgurl:" + image;
            } else if (item == "TinEye") {
                iframe.src = "https://tineye.com";
            } else if (item == "Sight Engine") {
                iframe.src = "https://sightengine.com";
            }
            page.appendChild(iframe);
        }
    })
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.img_url !== undefined) {
        displayResults(request.img_url);
    } else {
        sendResponse({error: "bad message: img_url not defined"});
    }
})

