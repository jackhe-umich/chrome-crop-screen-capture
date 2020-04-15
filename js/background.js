const default_engines = ['Google', 'Bing', 'TinEye'];
const default_cancel = 27;
chrome.storage.sync.set({engines: default_engines, cancelKeyCode: default_cancel}, function() {
    console.log("initialized engines to default");
});

chrome.runtime.onInstalled.addListener(function (object) {
    chrome.tabs.create({url: "../html/options.html"}, function (tab) {
        console.log("New tab launched with options");
    });
});

var Constants = {
    w: 500,
    h: 500,
    x: 200,
    y: 200
};

var contentURL = '';
var clientid = '4409588f10776f7';
var path = 'https://api.imgur.com/3/image';

function cropData(str, coords, callback) {
    var img = new Image();

    img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = coords.w;
        canvas.height = coords.h;

        var ctx = canvas.getContext('2d');

        ctx.drawImage(img, coords.x, coords.y, coords.w, coords.h, 0, 0, coords.w, coords.h);

        callback({ dataUri: canvas.toDataURL() });
    };

    img.src = str;
}

function capture(coords) {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, function (data) {
        cropData(data, coords, function (data) {
            console.log("Done");
            saveFile(data.dataUri);
        });
    });
}

chrome.browserAction.onClicked.addListener(function (tab) {
    contentURL = tab.url;

    chrome.tabs.executeScript(null, {
        file: 'js/content.js'
    }, function () {
        const port = chrome.tabs.connect(tab.id);
        port.postMessage({type: 'start-screenshots'});
        port.onMessage.addListener(gotMessage);
    })

    // sendMessage({ type: 'start-screenshots' }, tab);
});

chrome.extension.onMessage.addListener(gotMessage);

function gotMessage(request, sender, sendResponse) {
    if (request.type == "coords")
        capture(request.coords);

    sendResponse({}); // snub them.
}

function sendMessage(msg, tab) {
    console.log('sending message');
    console.log(msg)

    chrome.tabs.sendMessage(tab.id, msg, function (response) { });
};

function displayResults(image, page) {
    console.log("displaying results");
    chrome.storage.sync.get(['engines'], function(result) {
        result.engines.sort();
        console.log(result.engines);
        for (let item of result.engines) {
            console.log(item);
            if (item == "Google") {
                chrome.tabs.create({url: "http://images.google.com/searchbyimage?image_url=" + image, active: false});
            } else if (item == "Bing") {
                chrome.tabs.create({url: "https://www.bing.com/images/search?view=detailv2&iss=sbi&form=SBIIRP&sbisrc=UrlPaste&q=imgurl:" + image, active: false});
            } else if (item == "TinEye") {
                chrome.tabs.create({url: "https://tineye.com/search?url=" + image, active: false});
            } else if (item == "IQDB") {
                chrome.tabs.create({url: "https://iqdb.org/?url=" + image, active: false});
            } else if (item == "Yandex") {
                chrome.tabs.create({url: "https://yandex.com/images/search?url=" + image, active: false});
            }
        }
    })
}

function saveFile(dataURI) {

    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // create a blob for writing to a file
    var blob = new Blob([ab], { type: mimeString });

    // come up with a filename
    var name = contentURL.split('?')[0].split('#')[0];
    if (name) {
        name = name
            .replace(/^https?:\/\//, '')
            .replace(/[^A-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^[_\-]+/, '')
            .replace(/[_\-]+$/, '');
        name = '-' + name;
    } else {
        name = '';
    }
    name = 'screencapture' + name + '.png';

    function onwriteend() {
        // open the file that now contains the blob
        var URL = 'filesystem:chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/temporary/' + name;
        //debugBase64(URL);
        var fd = new FormData();
        fd.append('image', blob);
        var xhttp = new XMLHttpRequest();
        xhttp.open("POST", path, true);

        //Send the proper header information along with the request
        xhttp.setRequestHeader('Authorization', 'Client-ID ' + clientid);

        xhttp.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                var response = '';
                    try {
                        response = JSON.parse(this.responseText);
                    } catch (err) {
                        response = this.responseText;
                    }
                    if (response.success === true) {
                        var get_link = response.data.link.replace(/^http:\/\//i, 'https://');
                        displayResults(get_link);
                    }
            }
        };
        xhttp.send(fd);
        xhttp = null;
    }
    /**
     * Display a base64 URL inside an iframe in another window.
     */
    function debugBase64(base64URL) {
        var win = window.open();
        win.document.write('<iframe src="' + base64URL + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
    }

    function errorHandler() {
        console.log('uh-oh');
    }

    // create a blob for writing to a file
    window.webkitRequestFileSystem(TEMPORARY, 1024 * 1024, function (fs) {
        fs.root.getFile(name, { create: true }, function (fileEntry) {
            fileEntry.createWriter(function (fileWriter) {
                fileWriter.onwriteend = onwriteend;
                fileWriter.write(blob);
            }, errorHandler);
        }, errorHandler);
    }, errorHandler);
}
