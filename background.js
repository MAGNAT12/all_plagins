// Функция для сохранения данных по частям
function saveTemplatesInChunks(templates) {
  const chunkSize = 500; // Уменьшаем размер чанка, чтобы избежать превышения лимита
  const chunks = [];

  // Разбиваем данные на чанки
  for (let i = 0; i < templates.length; i += chunkSize) {
    chunks.push(templates.slice(i, i + chunkSize));
  }

  // Сохраняем каждый чанк в chrome.storage.local
  chunks.forEach((chunk, index) => {
    chrome.storage.local.set({ [`responseTemplates_chunk_${index}`]: chunk }, function() {
      if (chrome.runtime.lastError) {
        console.error("Ошибка при сохранении чанка:", chrome.runtime.lastError.message);
      } else {
        console.log(`Чанк ${index} успешно сохранен`);
      }
    });
  });
}

// Функция для загрузки шаблонов
function loadResponseTemplates() {
  fetch(chrome.runtime.getURL('responseTemplates.json'))
    .then(response => response.json())
    .then(data => {
      saveTemplatesInChunks(data); // Сохраняем данные по частям
    })
    .catch(error => console.error('Ошибка при загрузке шаблонов:', error));
}

// Загружаем шаблоны
loadResponseTemplates();
