document.getElementById('runScript').addEventListener('click', function() {
    // Отправляем сообщение на content.js для выполнения скрипта
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['content.js']
        });
    });
});