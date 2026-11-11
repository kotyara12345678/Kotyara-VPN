/* Общий скрипт страниц: размер шрифта и заглушки для ещё не готовых
   скриншотов. Без зависимостей, работает и при открытии файла с диска. */

(function () {
  var root = document.documentElement;
  var STORAGE_KEY = 'kotyara-doc-size';

  function applySize(size) {
    if (size === 'large') root.setAttribute('data-size', 'large');
    else root.removeAttribute('data-size');
  }

  try {
    applySize(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    /* приватный режим — просто игнорируем */
  }

  function setSize(size) {
    applySize(size);
    try {
      localStorage.setItem(STORAGE_KEY, size);
    } catch (error) {
      /* игнорируем */
    }
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-set-size]');
    if (!button) return;
    setSize(button.getAttribute('data-set-size'));
  });

  /* Скриншоты добавляются постепенно. Пока файла нет, показываем рамку с
     подписью «что здесь будет» — страница не выглядит сломанной. */
  function replaceWithPlaceholder(image) {
    /* Логотип и прочие декоративные картинки не превращаем в заглушки:
       подсказка нужна только там, где ожидается скриншот шага. */
    var figure = image.closest('.shot');
    if (!figure) return;
    var text =
      image.getAttribute('data-placeholder') ||
      image.getAttribute('alt') ||
      'Скриншот скоро появится';

    var box = document.createElement('div');
    box.className = 'shot-missing';
    box.textContent = text;

    if (image.parentNode) image.parentNode.replaceChild(box, image);
    if (figure) figure.classList.add('shot-pending');
  }

  document.addEventListener(
    'error',
    function (event) {
      var target = event.target;
      if (target && target.tagName === 'IMG') replaceWithPlaceholder(target);
    },
    true
  );

  /* Картинки, которые не успели загрузиться до подключения обработчика. */
  window.addEventListener('load', function () {
    Array.prototype.forEach.call(document.images, function (image) {
      if (image.complete && image.naturalWidth === 0) replaceWithPlaceholder(image);
    });
  });
})();
