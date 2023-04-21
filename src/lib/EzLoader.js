var ezLoader = (function() {
    var storageBox = {};
    var isInitialized = false;

    function _init(data) {
        var config = {
            autoEventBinding: true,
        }

        _windowResizeEvents();

        isInitialized = true;
    }

    function _windowResizeEvents() {
        window.addEventListener('resize', _repositionElements, false);
    }

    function _repositionElements(ev) {
        var ids = Object.keys(storageBox);
        for(var i = 0; i < ids.length; i += 1) {
            var sourceElement = document.getElementById(ids[i]);
            var element = storageBox[ids[i]];
            var sourceElementPosition = _getElementAbsPosition(sourceElement);
            var sourceElementStyles = _getElementStyle(sourceElement);

            if (!element) {
                continue;
            }
            element.style.top = sourceElementPosition.top + 'px';
            element.style.left = sourceElementPosition.left + 'px';
            element.style.width = sourceElementStyles.width;
            element.style.height = sourceElementStyles.height;
        }
    }

    function _addToStorageBox(id, element) {
        if (!storageBox[id]) {
            storageBox[id] = null;
        }

        storageBox[id] = element;
    }

    function _removeFromStorageBox(id) {
        if (!id || !storageBox[id]) {
            return false;
        }

        storageBox[id] = undefined;
    }

    function _getFromStorageBox(id) {
        if (!id || !storageBox[id]) {
            return false;
        }

        return storageBox[id];
    }

    function _showLoader(element, options) {
        if (!element || !element.id) {
            return false;
        }

        if (!isInitialized) {
            _init();
        }

        var customStyles;

        if(options && options.styles) {
            customStyles = options.styles;
        }

        _createNewLoadingElement(element, customStyles).then(function(newLoadingElement) {
            _addToStorageBox(element.id, newLoadingElement);
            _handleOriginalElement(element, 'disable');
        });

    }

    function _closeLoader(element) {
        if (!element || !element.id) {
            return false;
        }

        var isAnExternalSpinner = parseInt(element.getAttribute('data-spinner-outside') || -1);
        var spinnerOffset = (isAnExternalSpinner && isAnExternalSpinner > 0) ? isAnExternalSpinner : 40;

        if (isAnExternalSpinner >= 0) {
            var currentValue = parseInt(element.style.marginRight);
            element.style.marginRight = currentValue - spinnerOffset + 'px';
        }

        var loadingElement = _getFromStorageBox(element.id);
        _destroyLoadingElement(loadingElement);
        _removeFromStorageBox(element.id);
        _handleOriginalElement(element, 'enable');
    }

    function _handleOriginalElement(element, approach) {
        approach = approach || 'disable';
        if (!element || !element instanceof Element) {
            return false;
        }

        if (approach === 'disable') {
            element.setAttribute('disabled', true);
            element.classList.add('disabled');

        } else {
            element.removeAttribute('disabled', false);
            element.classList.remove('disabled');
        }
    }

    function _destroyLoadingElement(element) {
        _removeElement(element);
    }

    function _createNewLoadingElement(element, customStyles) {
        var isAnExternalSpinner = element.getAttribute('data-spinner-outside') !== null ? true : false;
        var spinnerOffset = 35;
        var delay = 300;

        if (isAnExternalSpinner) {
            var offsetValue = parseInt(element.getAttribute('data-spinner-outside') || 0);
            spinnerOffset = offsetValue || spinnerOffset;

            var currentValue = parseInt(element.style.marginRight || 0);
            element.style.marginRight = currentValue + spinnerOffset + 5 + 'px';
        }

        return new Promise((resolve) => {
            setTimeout(function() {
                var buttonPosition = _getElementAbsPosition(element);
                var elementStyles = _getElementStyle(element);
                var dataLoaderLabel = element.getAttribute('data-loader-label');
                var isGlobalLoader = element.getAttribute('data-global-loader') !== null;
                var hasSpinnerLoader = element.getAttribute('data-spinner-loader') !== null;
                var loaderLabel = typeof(dataLoaderLabel) == 'string' ? dataLoaderLabel : 'Processando ...';
                var loaderBackgroundColor = element.getAttribute('data-loader-bg-color') || 'rgba(255, 255, 255, .8)';

                var newElement = _createElement({
                    elementName: 'div',
                    properties: {
                        class: 'ez-local-loader'
                            + (isGlobalLoader ? ' ez-global-loader' : '')
                            + (isAnExternalSpinner ? ' has-external-spinner' : '')
                            + (loaderLabel == 'false' ? ' has-not-label' : ''),
                        text: loaderLabel != 'false' ? loaderLabel : '',
                        style: 'width: ' + elementStyles.width + ';'
                            + 'height: ' + elementStyles.height + ';'
                            + 'line-height: ' + (isGlobalLoader ? elementStyles.height : elementStyles.lineHeight) + ';'
                            + 'padding: ' + elementStyles.padding + ';'
                            + 'border: ' + elementStyles.border + ';'
                            + 'color: ' + elementStyles.color + ';'
                            + 'background: ' + (isGlobalLoader ? loaderBackgroundColor : elementStyles.background) + ';'
                            + 'box-sizing: ' + elementStyles.boxSizing + ';'
                            + 'text-align: ' + elementStyles.textAlign + ';'
                            + 'font-size: ' + elementStyles.fontSize + ';'
                            + 'font-family: ' + elementStyles.fontFamily + ';'
                            + 'border-radius: ' + elementStyles.borderRadius + ';'
                            + 'position: ' + (elementStyles.position === 'fixed' ? 'fixed' : 'absolute') + ';'
                            + 'top: ' + buttonPosition.top + 'px;'
                            + 'left: ' + buttonPosition.left + 'px;'
                            + (customStyles && customStyles.zIndex ? 'z-index:' + customStyles.zIndex + ';' : ''),
                    }
                });

                if (hasSpinnerLoader) {
                    var spinnerSize = element.getAttribute('data-spinner-loader');
                    _createElement({
                        elementName: 'div',
                        parentNode: newElement,
                        properties: {
                            class: 'ez-spinner-loader' + (spinnerSize === 'small' ? ' is-small' : ''),
                            style: 'right: -' + spinnerOffset + 'px;'
                                + (isAnExternalSpinner ? 'position: absolute;' : '')
                                + (dataLoaderLabel && dataLoaderLabel.length ? '' : 'margin: 0;')
                        }
                    });
                }

                resolve(newElement);
            }, delay)
        });
    }

    function _getElementStyle(element) {
        return element.currentStyle || window.getComputedStyle(element);
    };

    function _getElementAbsPosition(element) {
        if (!element) {
            return;
        }

        var position = {top: 0, left: 0};

        position.top += element.offsetTop;
        position.left += element.offsetLeft;

        if (element.offsetParent)  {
            element = element.offsetParent;
            var result = _getElementAbsPosition(element);
            position.top += result.top;
            position.left += result.left;
        }

        return position;
    }

    function _createElement(config) {
        if (!config || !config.elementName) {
            return;
        }

        config.parentNode = config.parentNode || document.body;
        config.properties = config.properties || false;

        var el = document.createElement(config.elementName);

        _setAttributes(el, config.properties);

        config.parentNode.appendChild(el);
        return el;
    }

    function _removeElement(element) {
        if (!element) {
            return;
        }

        if (typeof document.body.remove === 'function') {
            return element.remove();
        }

        return element.parentElement.removeChild(element);
    }

    function _setAttributes(element, properties) {
        if (!element || !properties) {
            return;
        }

        var nameKeys = [];
        var length = Object.keys(properties).length;

        if (length > 0 && typeof properties !== 'undefined') {
            nameKeys = Object.keys(properties);

            for (var i = 0; i < length; i += 1) {
                _setAttribute(element, nameKeys[i], properties[nameKeys[i]]);
            }
        }

        return true;
    }

    function _setAttribute(el, attr, value) {
        if (attr === 'text') {
            if (document.body.textContent) {
                el.textContent = value;

            } else {
                el.innerText = value;
            }

            return;
        }

        el.setAttribute(attr, value);

        return true;
    }

    return {
        init: _init,
        showLoader: _showLoader,
        closeLoader: _closeLoader,
        storageBox: storageBox,
        repositionElements: _repositionElements
    }
}());
