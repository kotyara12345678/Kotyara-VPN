/* Общий скрипт страниц: размер шрифта и актуальные файлы в кнопках
   скачивания. Без зависимостей, работает и при открытии файла с диска. */

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

  /* --- ссылки на скачивание ---------------------------------------------
     В кнопках лежат ссылки на страницу последнего релиза, поэтому они не
     ломаются никогда. Скрипт спрашивает у GitHub последний релиз и
     подставляет прямой файл, его размер и номер версии. Если запрос не
     удался (нет сети, лимит запросов, файл открыт с диска) — остаются
     обычные ссылки. */

  var GITHUB_REPO = 'kotyara12345678/Kotyara-VPN';
  var RELEASE_CACHE_KEY = 'kotyara-doc-release';
  var CACHE_TTL = 6 * 60 * 60 * 1000;
  var FILE_KINDS = {
    apk: { label: 'APK', test: /\.apk$/i },
    exe: { label: 'Setup.exe', test: /-setup\.exe$/i },
    deb: { label: '.deb', test: /\.deb$/i },
    appimage: { label: 'AppImage', test: /\.appimage$/i },
  };

  function fileSize(bytes) {
    var mb = bytes / (1024 * 1024);
    if (mb >= 10) return Math.round(mb) + ' МБ';
    return mb.toFixed(1).replace('.', ',') + ' МБ';
  }

  function applyRelease(release) {
    if (!release || !release.assets) return;

    var version = String(release.tag_name || '').replace(/^v/i, '');

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-download]'),
      function (link) {
        var kind = FILE_KINDS[link.getAttribute('data-download')];
        if (!kind) return;

        var asset = release.assets.filter(function (item) {
          return kind.test.test(item.name);
        })[0];
        if (!asset) return;

        link.href = asset.browser_download_url;

        var note = link.querySelector('[data-download-note]');
        if (note) {
          var sub = link.getAttribute('data-download-sub');
          note.textContent = [kind.label, fileSize(asset.size)]
            .concat(sub ? [sub] : [])
            .concat(version ? ['v' + version] : [])
            .join(' · ');
        }
      }
    );

    var date = release.published_at
      ? new Date(release.published_at).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
        })
      : '';
    var label = version
      ? 'Версия ' + version + (date ? ' от ' + date : '')
      : '';

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-release-version]'),
      function (node) {
        node.textContent = label ? label + '.' : '';
      }
    );
  }

  function readCachedRelease() {
    try {
      var raw = localStorage.getItem(RELEASE_CACHE_KEY);
      if (!raw) return null;
      var cached = JSON.parse(raw);
      if (!cached || Date.now() - cached.time > CACHE_TTL) return null;
      return cached.release;
    } catch (error) {
      return null;
    }
  }

  function loadRelease() {
    if (!document.querySelector('[data-download], [data-release-version]')) {
      return;
    }

    var cached = readCachedRelease();
    if (cached) {
      applyRelease(cached);
      return;
    }

    if (!window.fetch) return;

    fetch('https://api.github.com/repos/' + GITHUB_REPO + '/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (release) {
        if (!release || !release.assets) return;
        applyRelease(release);
        try {
          localStorage.setItem(
            RELEASE_CACHE_KEY,
            JSON.stringify({ time: Date.now(), release: release })
          );
        } catch (error) {
          /* хранилище недоступно — не страшно */
        }
      })
      .catch(function () {
        /* нет сети — оставляем ссылки из разметки */
      });
  }

  loadRelease();
})();
