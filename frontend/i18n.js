// frontend/i18n.js
/*jshint esversion: 6 */ 
console.log('DEBUG: i18n.js VERSION 3.1 - Cleaned up');

var i18n = {
    currentLanguage: 'en',
    translations: {},

    loadLanguage: function(lang) {
        var _this = this;
        return fetch('locales/' + lang + '.json')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Failed to load language file: ' + lang + '.json (' + response.status + ')');
                }
                return response.json();
            })
            .then(function(jsonData) {
                _this.translations[lang] = jsonData;
                console.log('Loaded translations for ' + lang + '.');
                return _this.translations[lang];
            })
            .catch(function(error) {
                console.error('Error loading language \'' + lang + '\':', error);
                if (lang !== 'en' && !_this.translations.en) {
                    console.warn("Falling back to English as default.");
                    return _this.loadLanguage('en');
                } else if (lang !== 'en' && _this.translations.en) {
                    _this.currentLanguage = 'en';
                    return _this.translations.en;
                } else if (lang === 'en' && Object.keys(_this.translations).length > 0) {
                    var firstAvailableLang = Object.keys(_this.translations)[0];
                    if (firstAvailableLang) {
                        console.log("Falling back to first available language: " + firstAvailableLang);
                        _this.currentLanguage = firstAvailableLang;
                        return _this.translations[firstAvailableLang];
                    }
                }
                return {};
            });
    },

    applyTranslations: function() {
        var _this = this;
        var langTranslations = this.translations[this.currentLanguage];

        if (!langTranslations || Object.keys(langTranslations).length === 0) {
            console.warn('[i18n] applyTranslations: No translations available for language: ' + this.currentLanguage);
        }

        document.querySelectorAll('[data-i18n-key]').forEach(function(element) {
    var key = element.getAttribute('data-i18n-key');
    var translatedText = _this.getTranslation(key, key);

    // Excluir el botón del sidebar para no borrar el SVG
    if (element.id === 'sidebar-toggle') {
        element.setAttribute('aria-label', translatedText);
        element.setAttribute('title', translatedText);
        // NO modificar .textContent ni .innerHTML aquí
    } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        if (element.placeholder && (element.type === 'text' || element.type === 'email' || element.type === 'password' || element.type === 'url' || element.type === 'tel' || element.type === 'number' || element.type === 'search')) {
            element.placeholder = translatedText;
        } else if (element.type === 'submit' || element.type === 'button') {
            element.value = translatedText;
        }
    } else {
        element.textContent = translatedText;
    }
});

        var siteTitleKey = 'site_title_document';
        if (document.body.id === 'admin-page') {
            siteTitleKey = 'admin_page_title';
        }
        document.title = this.getTranslation(siteTitleKey, 'Default Title');
    },

    setLanguage: function(lang) {
        var _this = this;
        return this.loadLanguage(lang).then(function() {
            _this.currentLanguage = lang;
            localStorage.setItem('preferredLanguage', _this.currentLanguage);
            _this.applyTranslations();

            if (document.body.id === 'admin-page') {
                const languageSelectAdmin = document.getElementById('language-select-admin');
                if (languageSelectAdmin) languageSelectAdmin.value = _this.currentLanguage;
            }
            if (typeof updateActiveLanguageButton === 'function' && document.getElementById('language-buttons-container-dropdown')) {
                 updateActiveLanguageButton(_this.currentLanguage);
            }
        }).catch(function(error) {
            console.error("Failed to set language " + lang + ":", error);
            _this.applyTranslations();
        });
    },

    getTranslation: function(key, fallback) {
        var actualFallback = (typeof fallback !== 'undefined') ? fallback : key;
        var langTranslations = this.translations[this.currentLanguage];

        if (langTranslations && typeof langTranslations[key] !== 'undefined') {
            return langTranslations[key];
        }
        return actualFallback;
    },

    initializeI18n: function() {
        var _this = this;
        var preferredLanguage = localStorage.getItem('preferredLanguage') || (navigator.language ? navigator.language.split('-')[0] : 'en') || 'en';
        
        return this.loadLanguage(preferredLanguage)
            .then(function(loadedTranslations) {
                if (loadedTranslations && Object.keys(loadedTranslations).length > 0) {
                    _this.currentLanguage = preferredLanguage;
                } else {
                    if (preferredLanguage !== 'en' && (!_this.translations.en || Object.keys(_this.translations.en).length === 0) ) {
                        console.warn(`Preferred language "${preferredLanguage}" failed to load. Attempting to load English.`);
                        return _this.loadLanguage('en').then(function(englishTranslations) {
                            if (englishTranslations && Object.keys(englishTranslations).length > 0) {
                               _this.currentLanguage = 'en';
                            } else {
                                console.error("Critical: Failed to load preferred language and fallback English. Using keys as text.");
                                _this.currentLanguage = 'en';
                                _this.translations.en = {};
                            }
                        });
                    } else if (preferredLanguage !== 'en' && _this.translations.en && Object.keys(_this.translations.en).length > 0) {
                         _this.currentLanguage = 'en';
                    } else if (preferredLanguage === 'en' && (!loadedTranslations || Object.keys(loadedTranslations).length === 0)) {
                         console.error("Critical: Failed to load English (preferred language). Using keys as text.");
                         _this.currentLanguage = 'en';
                         _this.translations.en = {};
                    }
                }
            })
            .then(function() {
                localStorage.setItem('preferredLanguage', _this.currentLanguage);
                _this.applyTranslations();
                if (document.body.id === 'admin-page') {
                    const languageSelectAdmin = document.getElementById('language-select-admin');
                    if (languageSelectAdmin) languageSelectAdmin.value = _this.currentLanguage;
                }
                if (typeof updateActiveLanguageButton === 'function' && document.getElementById('language-buttons-container-dropdown')) {
                    updateActiveLanguageButton(_this.currentLanguage);
                }
                console.log('[i18n] initializeI18n: Initialization attempt complete. Current language: ' + _this.currentLanguage);
            })
            .catch(function(error) {
                console.error("[i18n] initializeI18n: Critical initialization failed.", error);
                _this.currentLanguage = 'en'; 
                _this.translations = { en: {} }; 
                _this.applyTranslations();
            });
    }
};