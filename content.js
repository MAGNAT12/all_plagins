// Функция для сохранения данных по частям
function saveTemplatesInChunks(templates) {
  const chunkSize = 500; // Уменьшаем размер чанка
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

// Функция для создания кнопок с шаблонами
function createTemplatesButtons() {
  const storage = (typeof browser !== "undefined") ? browser.storage : chrome.storage;
  storage.local.get(null, function (result) {
    const responseTemplates = [];
    for (let key in result) {
      if (key.startsWith("responseTemplates_chunk_")) {
        responseTemplates.push(...result[key]);
      }
    }

    // Обновляем селекторы
    const complaintNumberElement = document.querySelector(".content-info .item:nth-child(1) .title");
    const complainantElement = document.querySelector(".content-info .item:nth-child(2) .title");
    const accusedElement = document.querySelector(".content-info .item:nth-child(3) .title");

    if (!complaintNumberElement || !complainantElement || !accusedElement) {
      console.error("Обязательные элементы не найдены на странице");
      return;
    }

    const complaintNumber = complaintNumberElement.textContent.replace("# ", "#");
    const complainant = complainantElement.textContent;
    const accused = accusedElement.textContent;

    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("templates-buttons-container");

    responseTemplates.forEach(function (template) {
      const templateButton = document.createElement("button");
      templateButton.innerText = template.name;
      templateButton.classList.add("template-button");
      templateButton.dataset.description = template.description;
      templateButton.dataset.text = template.text.replace("{complain_from}", complainant)
                                                  .replace("{complain_number}", complaintNumber)
                                                  .replace("{complain_on}", accused);

      const tooltip = document.createElement("span");
      tooltip.classList.add("tooltip");
      tooltip.innerText = template.description;
      templateButton.appendChild(tooltip);

      templateButton.addEventListener("click", function () {
        const responseTextarea = document.querySelector(".verdict textarea");
        if (responseTextarea) {
          responseTextarea.value = templateButton.dataset.text;
          responseTextarea.dispatchEvent(new Event("input"));
        } else {
          console.error("Текстовое поле ответа не найдено");
        }
      });

      buttonsContainer.appendChild(templateButton);
    });

    const customStyles = document.createElement("style");
    customStyles.innerHTML = `
      .templates-buttons-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        margin-top: 10px;
      }

      .template-button {
        margin: 5px;
        padding: 10px 20px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 14px;
        cursor: pointer;
        position: relative;
      }

      .template-button .tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background-color: #f2f2f2;
        color: #333;
        padding: 5px 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        white-space: nowrap;
        display: none;
        z-index: 1;
      }

      .template-button:hover .tooltip {
        display: block;
      }
    `;
    document.head.appendChild(customStyles);

    const infoBlock = document.querySelector(".content-info");
    if (infoBlock) {
      infoBlock.parentNode.insertBefore(buttonsContainer, infoBlock.nextSibling);
    } else {
      console.error("Информационный блок не найден");
    }
  });
}

// Проверяем, что мы на странице жалоб
function checkComplaintsPage() {
  const complaintsContent = document.querySelector(".admin-complaints-content");
  if (complaintsContent) {
    createTemplatesButtons();
  } else {
    setTimeout(checkComplaintsPage, 1000);
  }
}

// Запускаем проверку страницы жалоб
checkComplaintsPage();



// Форма для выдычи наказания 
(function() {
  'use strict';

  let formContainer = null;

  function getComplaintData() {
      try {
          // Извлечение номера жалобы 
          const complaintNumberElement = document.querySelector('.admin-complaints-content .content-info .item:nth-of-type(1) .title');
          let complaintNumber = complaintNumberElement ? complaintNumberElement.textContent.trim() : 'Не найдено';
          // Удаляем лишние пробелы и двойные #
          complaintNumber = complaintNumber.replace(/^\s*#\s*|\s*#\s*$/g, '');

          // Извлечение никнейма нарушителя 
          const violatorElement = document.querySelector('.admin-complaints-content .content-info .item:nth-of-type(3) .title');
          const violatorNickname = violatorElement ? violatorElement.textContent.trim() : 'Не найдено';

          // Извлечение имени администратора
          const verdictElement = document.querySelector('.verdict.answer .title');
          const verdictText = verdictElement ? verdictElement.textContent : '';
          const adminNameMatch = verdictText.match(/администратором (\w+_\w+)/);
          const adminName = adminNameMatch ? adminNameMatch[1] : 'Не найдено';

          const adminInitial = adminName.split('_')[0][0];
          const adminSurname = adminName.split('_')[1];
          const formattedAdminName = `${adminInitial}.${adminSurname}`;

          return {
              complaintNumber,
              violatorNickname,
              formattedAdminName
          };
      } catch (error) {
          alert('Ошибка при извлечении данных: Не удалось извлечь необходимые данные.');
          console.error(error);
          return null;
      }
  }

  function createForm() {
      formContainer = document.createElement('div');
      formContainer.style.position = 'fixed';
      formContainer.style.bottom = '20px';
      formContainer.style.left = '20px';
      formContainer.style.padding = '15px';
      formContainer.style.backgroundColor = 'white';
      formContainer.style.border = '2px solid #faca2b';
      formContainer.style.borderRadius = '10px';
      formContainer.style.zIndex = '10000';
      formContainer.style.maxWidth = '490px';
      formContainer.style.resize = 'both';
      formContainer.style.overflow = 'auto';

      const selectPunishment = document.createElement('select');
      const punishments = ['/offban', '/offwarn', '/offmute', '/ioffban', '/offjail'];
      punishments.forEach(punishment => {
          const option = document.createElement('option');
          option.value = punishment;
          option.innerText = punishment;
          selectPunishment.appendChild(option);
      });

      selectPunishment.style.marginRight = '10px';
      selectPunishment.style.padding = '5px';
      selectPunishment.style.borderRadius = '5px';
      selectPunishment.style.backgroundColor = '#fcd754';

      const durationInput = document.createElement('input');
      durationInput.type = 'number';
      durationInput.placeholder = 'Мин/Дн';
      durationInput.style.width = '70px';
      durationInput.style.marginRight = '10px';
      durationInput.style.display = 'inline';
      durationInput.style.padding = '5px';
      durationInput.style.borderRadius = '5px';

      // В писования правила которое было нарушено
      const rulesInput = document.createElement('input');
      rulesInput.type = 'text';
      rulesInput.placeholder = 'Правила';
      rulesInput.style.width = '70px';
      rulesInput.style.marginRight = '10px';
      rulesInput.style.display = 'inline';
      rulesInput.style.padding = '5px';
      rulesInput.style.borderRadius = '5px';


      const generateButton = document.createElement('button');
      generateButton.innerText = 'Сгенерировать команду';
      generateButton.style.padding = '5px';
      generateButton.style.borderRadius = '5px';
      generateButton.style.backgroundColor = '#fcd754';
      generateButton.style.border = 'none';
      generateButton.style.cursor = 'pointer';

      generateButton.onclick = function() {
          const complaintData = getComplaintData();
          if (!complaintData) return;

          const { complaintNumber, violatorNickname, formattedAdminName } = complaintData;
          const punishmentType = selectPunishment.value;
          const duration = durationInput.value;
          let command = `${punishmentType} ${violatorNickname}`;

          if (punishmentType === '/offban' || punishmentType === '/offmute' || punishmentType === '/offjail') {
              if (!duration || duration.trim() === '') {
                  alert('Ошибка: Укажите продолжительность!');
                  return;
              }
              command += ` ${duration}`;
          }            

          // Форматируем номер жалобы
          const reason = `${rulesInput.value} | ЖБ #${complaintNumber} by ${formattedAdminName}`;
          command += ` ${reason}`;

          commandOutput.value = command;
      };

      const commandOutput = document.createElement('textarea');
      commandOutput.style.width = '100%';
      commandOutput.style.height = '60px';
      commandOutput.style.marginTop = '10px';
      commandOutput.style.resize = 'none';
      commandOutput.style.padding = '5px';
      commandOutput.style.borderRadius = '5px';

      const copyButton = document.createElement('button');
      copyButton.innerText = 'Копировать команду';
      copyButton.style.marginTop = '10px';
      copyButton.style.padding = '5px';
      copyButton.style.borderRadius = '5px';
      copyButton.style.backgroundColor = '#fcd754';
      copyButton.style.border = 'none';
      copyButton.style.cursor = 'pointer';
      copyButton.onclick = function() {
          commandOutput.select();
          document.execCommand('copy');
          alert('Команда скопирована в буфер обмена!');
      };

      const durationContainer = document.createElement('div');
      durationContainer.style.display = 'inline';

      selectPunishment.addEventListener('change', function() {
          if (this.value === '/offwarn' || this.value === '/ioffban') {
              durationInput.style.display = 'none';
              durationContainer.style.display = 'none';
          } else {
              durationInput.style.display = 'inline';
              durationContainer.style.display = 'inline';
          }
      });

      durationContainer.appendChild(durationInput);
      formContainer.appendChild(selectPunishment);
      formContainer.appendChild(durationContainer);
      formContainer.appendChild(rulesInput);
      formContainer.appendChild(generateButton);
      formContainer.appendChild(commandOutput);
      formContainer.appendChild(copyButton);
      document.body.appendChild(formContainer);
  }

  function shouldShowForm() {
      return /\/admin\/complaints\/\d+/.test(window.location.pathname);
  }

  function updateFormVisibility() {
      if (shouldShowForm()) {
          if (!formContainer) {
              createForm();
          } else {
              formContainer.style.display = 'block';
          }
      } else {
          if (formContainer) {
              formContainer.style.display = 'none';
          }
      }
  }

  function observeDOMChanges() {
      const observer = new MutationObserver(() => {
          updateFormVisibility();
      });

      observer.observe(document.body, {
          childList: true,
          subtree: true
      });
  }

  window.addEventListener('load', () => {
      updateFormVisibility();
      observeDOMChanges();
  });
})();