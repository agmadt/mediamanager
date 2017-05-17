(function (root, factory) {
    var pluginName = 'Mediamanager';

    if (typeof define === 'function' && define.amd) {
        define([], factory(pluginName));
    } else if (typeof exports === 'object') {
        module.exports = factory(pluginName);
    } else {
        root[pluginName] = factory(pluginName);
    }
}(this, function (pluginName) {
    'use strict';

    var mediaManagerActive = false;

    var defaults = {
      buttonText: 'Insert to Post',
      loadItemsUrl: null,
      loadNextItemsUrl: null,
      loadNextItemsObject: {},
      loadNextItemDelay: 3000,
      deleteButtonText: 'Delete',
      deleteConfirmationText: 'Are you sure?',
      deleteItemUrl: null,
      uploadUrl: null,
      wrapperId: 'mediamanager',
      insertType: 'OBJECT',
      insert: function () {}
    };

    var extend = function (target, options) {
        var prop, extended = {};
        for (prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = defaults[prop];
            }
        }
        for (prop in options) {
            if (Object.prototype.hasOwnProperty.call(options, prop)) {
                extended[prop] = options[prop];
            }
        }
        return extended;
    };

    /**
     * Some private helper function
     */
    var build = function() {

      var _mediamanagerContentWrapperElement = document.createElement('div'),
          _mediamanagerUploadWrapperElement = document.createElement('div'),
          _ = this;

      // Build header
      _buildHeader.call(this);

      // Build item wrapper
      var _mediamanagerItemWrapper = _buildItemWrapper.call(this);
      
      // Build footer
      var _mediamanagerFooterElement = _buildFooter.call(this);

      // Build content wrapper
      _mediamanagerContentWrapperElement.classList.add('mediamanager__content-wrapper');
      _mediamanagerContentWrapperElement.appendChild(_mediamanagerItemWrapper);
      _mediamanagerContentWrapperElement.appendChild(_mediamanagerFooterElement);
      
      this.element.classList.add('mediamanager-wrapper');
      this.element.appendChild(_mediamanagerContentWrapperElement);

      // If uploadUrl is specified, enable upload feature
      if (this.options.uploadUrl) {
        // Build upload wrapper
        _mediamanagerUploadWrapperElement.classList.add('mediamanager__upload-wrapper');
        _mediamanagerUploadWrapperElement.classList.add('--hidden');

        // Build Dropzone
        if (this.isDropzone) {
          Dropzone.autoDiscover = false;
          var _mediamanagerUploadForm = document.createElement('form');
          _mediamanagerUploadWrapperElement.appendChild(_mediamanagerUploadForm);
          _mediamanagerUploadForm.setAttribute('action', '/');
          _mediamanagerUploadForm.classList.add('dropzone');
          this.Dropzone = new Dropzone(_mediamanagerUploadForm, {
                              url: this.options.uploadUrl,
                              init: function () {
                                this.on('success', function (file, responseText) {
                                    _.Dropzone.removeAllFiles();
                                    _.element.querySelector('.mediamanager-header__button').click();

                                    var DzResponse = JSON.parse(responseText);

                                    _.loadedItemsArray.push(DzResponse);
                                    renderLoadedItem.call(_, DzResponse, _.loadedItemsArray.length - 1, true);
                                })
                              }
                          });
        }

        this.element.appendChild(_mediamanagerUploadWrapperElement);
      }

      if (this.options.loadItemsUrl){
        loadItems.call(this);
      }

      // Build backdrop-layer
      _buildBackdropLayer.call(this);
    }

    var initializeEvents = function() {

      var _ = this;

      // Load next media item
      // If the loadNextItemUrl is specified, enable the load next item feature
      if (_.options.loadNextItemsUrl) {
        // Media item wrapper mouseover event
        _.element.querySelector('.mediamanager-content__items-wrapper').onmouseover = function (event) {
          var _this = this;

          if (!_this.classList.contains('--unloadable')) {
            loadNextItemsFunc.call(_, _this);
          }

          if (_.loadedItemsArray.length > 14) {
            _this.onmouseover = null;
          }
        }

        // Media item wrapper scrolled event
        _.element.querySelector('.mediamanager-content__items-wrapper').onscroll = function () {
          var _this = this;

          // To loadNextItem when the scroll is reaching bottom
          if (_this.scrollHeight - _this.scrollTop === _this.clientHeight && !_this.classList.contains('--unloadable')) {
            loadNextItemsFunc.call(_, _this);
          }
        }
      }
      // Load next media item end

      // Media item
      _.element.addEventListener('click', function (e) {

        var _thisItemEl = e.target.parentNode,
            _objectId = _thisItemEl.getAttribute('object-id');

        if (e.target.classList.contains('mediamanager-item__delete-button')) {
          var _mediaManagerDeleteConfirm = confirm(_.options.deleteConfirmationText);

          if (_mediaManagerDeleteConfirm) {
            deleteItem.call(_, _thisItemEl, _objectId);
          }

          return false;
        }

        if (_thisItemEl.classList.contains('mediamanager__item')) {

          if (_thisItemEl.classList.contains('--selected')) {

            _thisItemEl.classList.remove('--selected');

            removeSelectedItem.call(_, _objectId);

          } else {

            _thisItemEl.classList.add('--selected');

            _.selectedItemsArray.push(_.loadedItemsArray[_objectId]);

          }

          _updateSelectedItemElement.call(_);

        }
      });


      // Footer insert to post button event
      _.element.querySelector('.mediamanager-content-footer__insert-to-post-button').addEventListener('click', function() {
        var _mediaItem = getMediaItems.call(_);

        for (var i = 0; i < _mediaItem.length; i++) {
          var _insertMediaItem = null;

          if (_.options.insertType != 'string' || _.options.insertType != 'html') {
            _insertMediaItem = renderSelectedItemAs.call(_, _.options.insertType, _mediaItem[i]);
          } else {
            _insertMediaItem = _mediaItem[i];
          }
          
          _.options.insert(_insertMediaItem);
        }

        Mediamanager.prototype.close.call(_);
      });

      // Header upload tab
      // If uploadUrl is speficied and dropzone is present, enable upload feature 
      if (_.isDropzone && this.options.uploadUrl) {
        var _mediamanagerHeaderButtonElement = _.element.querySelectorAll('.mediamanager-header-left__item');

        _mediamanagerHeaderButtonElement.forEach(function(item, i) {
          item.addEventListener('click', function () {

            _mediamanagerHeaderButtonElement.forEach(function(item, i) {
              var _headerButtonTarget = item.getAttribute('target');
              item.classList.remove('--selected');
              _.element.querySelector(_headerButtonTarget).classList.add('--hidden');
            });

            var _headerButtonTarget = this.getAttribute('target');

            this.classList.add('--selected');
            _.element.querySelector(_headerButtonTarget).classList.remove('--hidden');
            if (item.classList.contains('mediamanager-header__upload-button')) {
              removeAllSelectedItem.call(_);
            }
          });
        });
      }

      // Header clear selected
      _.element.querySelector('.mediamanager-header-right__item-clear-selected').addEventListener('click', function() {
        removeAllSelectedItem.call(_);
      });

      // Backdrop click
      _.element.parentNode.querySelector('.backdrop-layer').addEventListener('click', function () {
        Mediamanager.prototype.close.call(_);
      });

      // When escape key pressed, close media manager
      document.addEventListener("keydown", function (event) {
        if (event.keyCode == 27 && _.mediaManagerActive) {
          Mediamanager.prototype.close.call(_);
        }
      });
    }

    var getMediaItems = function() {

      var _selectedMediaItems = [];

      for (var i = 0; i < this.selectedItemsArray.length; i++) {

        _selectedMediaItems.push(this.selectedItemsArray[i]);
      }

      return _selectedMediaItems;
    }

    var loadItems = function() {
      var _request = new XMLHttpRequest(),
          _ = this;

      _request.open('GET', _.options.loadItemsUrl, true);

      _request.onload = function() {

        if (_request.status >= 200 && _request.status < 400) {

          _.loadedItemsArray = JSON.parse(_request.responseText);

          for (var i = 0; i < _.loadedItemsArray.length; i++) {
            renderLoadedItem.call(_, _.loadedItemsArray[i], i);
          }

        } else {
            console.log('"initial load items ajax error" - We reached our target server, but it returned an error');
        }
      };

      _request.onerror = function() {

      };

      _request.send();
    }

    var loadNextItemsFunc = function (element) {

      element.classList.add('--unloadable');

      setTimeout(function(){
        element.classList.remove('--unloadable');
      }, this.options.loadNextItemDelay);

      loadNextItems.call(this);
    }

    var loadNextItems = function () {
      var _request = new XMLHttpRequest(),
          data = {
            totalItems: this.loadedItemsArray.length,
            custom: this.options.loadNextItemsObject
          },
          formdata = null,
          _ = this;

      formdata = _ajaxFormatParams(data).slice(0, -1 );

      _request.open('POST', this.options.loadNextItemsUrl, true);
      _request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

      _request.onload = function() {

        if (_request.status >= 200 && _request.status < 400) {

          var _requestResponses = JSON.parse(_request.responseText);

          if (Array.isArray(_requestResponses)) {
            for (var i = 0; i < _requestResponses.length; i++) {
              renderLoadedItem.call(_, _requestResponses[i], _.loadedItemsArray.length -1);
              _.loadedItemsArray.push(_requestResponses[i]);
            }
          } else {
            console.log('Data loaded from "next item loaded" must be an array.');
          }

        } else {
            console.log('"next item loaded ajax error" - We reached our target server, but it returned an error');
        }
      };

      _request.send(formdata);
    }

    var _ajaxFormatParams = function (data) {
      var _tmpParams = '',
          _tmpParamsIterator = 0;

      for (var key in data) {
        if (typeof data[key] == 'object') {
          _tmpParams += _ajaxFormatParams(data[key]);
        } else {
          _tmpParams += key+'='+data[key];
          _tmpParams += '&';
        }
      }

      return _tmpParams;
    }

    var renderLoadedItem = function(data, objectId, firstAppendedElement) {

      var _ = this,
          _renderedItemWrapper = null,
          _renderedItem = null,
          _itemRender = null,
          _renderedElementWrapper = null,
          _mediaManagerItemElementFakeLayer = document.createElement('div'),
          _mediaManagerItemDeleteButton = document.createElement('div'),
          _mediamanagerContentItemWrapper = _.element.querySelector('.mediamanager-content__items-wrapper');

          _itemRender = document.createElement('img');

          _renderedElementWrapper = document.createElement('div');
          _renderedElementWrapper.classList.add('mediamanager__item');
          _renderedElementWrapper.setAttribute('object-id', objectId);

          _renderedElementWrapper.appendChild(_itemRender);

          _mediaManagerItemElementFakeLayer.classList.add('mediamanager-item__layer');
          _renderedElementWrapper.appendChild(_mediaManagerItemElementFakeLayer);

          // If delete item url is specified, enable delete item feature
          if (this.options.deleteItemUrl) {
            _mediaManagerItemDeleteButton.classList.add('mediamanager-item__delete-button');
            _mediaManagerItemDeleteButton.innerHTML = this.options.deleteButtonText;
            _renderedElementWrapper.appendChild(_mediaManagerItemDeleteButton);
          }

          renderLoadedItemToMediaManager(_itemRender, data);

          if (firstAppendedElement) {
            _mediamanagerContentItemWrapper.insertBefore(_renderedElementWrapper, _mediamanagerContentItemWrapper.firstChild);
          } else {
            _mediamanagerContentItemWrapper.appendChild(_renderedElementWrapper);
          }
    }

    var renderLoadedItemToMediaManager = function (_itemRenderElement, data) {
      var _fileMatchedType = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAAUVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABcqRVCAAAAGnRSTlMAAgkQGyAwUF9gb3Cfr7C0vL/Az9Df7/D19lwfg1sAAADzSURBVHja7dhBD4IwDIbhanU60YGgoP3/P9TERJtAwLJ9Bw99z8sDY5QD9Ol4EWvXE9OvWDlL/ekXqJ6xLix6UVbXxyUwSUZnngffCw5kS7fNy2toLSj3AAalDzAwqogBKQx62BCQ9jd5F1Eg8U13DQFVRIEqYkAV74wBVewYA6p4hoG0H/TlgYAU9GAAoH5Mu0JwWoUGewaDUuWC7QzY5oKcZsQJWJCDDjro4F+Au1oM1Tsz2IipxgpunzbwsUHfIfwZ+nvok+KT4pPik+KT4pPioIP54CHfi2MwCaA0uUJhkbC3mCZ/Ogo9Hj/XVMR9T/QFzO/QVRK6AysAAAAASUVORK5CYII=',
          _fileExtensionType = getItemExtensionType(data),
          _path = '',
          _filename = '',
          _displayFilename;

      if (data.path) {
        _path = data.path;
      }

      if (data.filename) {
        _filename = data.filename;
      }

      if (data.filetype) {
        _fileExtensionType = data.filetype;
      }

      if (_fileExtensionType == 'image') {
        _fileMatchedType = _path + _filename;

        if (data.display_file) {
          _fileMatchedType = _path + display_filename;          
        }

      } else if (_fileExtensionType == 'music') {
        _fileMatchedType = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAATlBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADEoqZZAAAAGXRSTlMAECAwP0BQX2BvcH+An6CvsL/Az9Df4O/wsv/mkQAAAWxJREFUeAHt2M1ugzAQxPG13abOtw0FOu//olVL9xKLCdmslB74n9HPaOACon1csba6D3KvwLi2aX8PXO1pfaJexsNNmYEFhs5kSfy0k3VB6wO/Rh4FMSRnEFNyAzMVDaCkr1nMXqDET/yWvUAJszglH5CINpCIdlDFIXiBKvbBC1Tx7AZKnN/H7AZK0gfjBUqeZ3wSbDt4g1NwBnGwgt0C2FnBUBbEFrS3gS8Hw9vxOqBGM9hYc8UKNpZmABvLDHLLDsYKkgGscAbx1waOxQNU6/QeRBxAtebsYGM5gGq5gaJt4H8E47FOQF/30QVMFRo8wAy4ghm+YIQFJNtfTCDZfjCBZHuYQLL9iKaRg2T7hQ0vHCTbL5wUKUi2X9giyxqQbJ8XPA6y7VMHDV0SBq7dPp66ERi7UxThIN+eRECyvQFk25tBsr0V5Ntvn2YvAHd2L9+CBQ6V5oQny+J7i4X86TB54XbXp8iyU+cbUl3m0Vv4Iq8AAAAASUVORK5CYII=';
      } else if (_fileExtensionType == 'video') {
        _fileMatchedType = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAAaVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnbPKNAAAAInRSTlMAAQgQGyApMENQWF9gbm9wkJ+nqK+wvL/Az9DW3+Tv8Pf+c7NfdwAAAT1JREFUeAHt2FFTglAQxfGtzYi6aVK3xAxrv/+HbGrmPEQD4vU/jg+cZ+cnwmFZMeXhJabmbel2KD6NU7rlIVDe5LTVqJfi6HRpDMxRkLUPg/GT2qYllNbHP2PHgrGrYDC6CgOTRAq0aq+LDYG22MZvEgWab/WrEbAnAmBPRECJO6dAia1ToMQ1Btpir/JAoFW6MBCoYdqeCP7PigY7h8FYlYKbAXBTCnoeEAfAoszgGcHGYTA+7mAwvp6uWTDi/RYG4/PxigUjXm9gMLp7DFQah0EViANVIA5UgUBQBeJAFQgEVSAOVIFAUAXiQBWIAJVn/Agv+hw2DveQvlPoexmeNvQ8vOiJ3Tj/1OOfy/zmwO82/PbF74fwBjv/C5jBGazLvdQHcwDJf74BSDL2EPPIm44iz/vnNZ/E1XK+AWBw/UVvlPBrAAAAAElFTkSuQmCC';
      }
      
      _itemRenderElement.setAttribute('src', _fileMatchedType);

      if (_fileExtensionType != 'image') {
        var _itemRenderParentElement = _itemRenderElement.parentNode,
            _itemRenderFileNameElement = document.createElement('div');

        _itemRenderFileNameElement.classList.add('mediamanager-item__filename-wrapper');
        _itemRenderFileNameElement.innerHTML = _filename;

        _itemRenderParentElement.appendChild(_itemRenderFileNameElement);
        _itemRenderParentElement.classList.add('filetype');
      }
    }

    var renderSelectedItemAs = function (type, data) {
      var _fileExtensionType = getItemExtensionType(data),
          _renderItem = document.createElement('a'),
          _path = '',
          _filename = '';

      if (data.path) {
        _path = data.path;
      }

      if (data.filename) {
        _filename = data.filename;
      }

      if (data.filetype) {
        _fileExtensionType = data.filetype;
      }

      _renderItem.setAttribute('href', _path + _filename);
      _renderItem.setAttribute('target', '_blank');
      _renderItem.innerHTML = _filename;

      if (type == 'string') {
        _renderItem = '<a href="'+_path + _filename+'" target="_blank">'+_filename+'</a>';
      }

      if (_fileExtensionType == 'image') {
        _renderItem = document.createElement('img');
        _renderItem.setAttribute('src', _path + _filename);

        if (type == 'string') {
          _renderItem = '<img src="'+_path + _filename+'">';
        }
      }

      return _renderItem;
    }

    var removeAllMediaItems = function () {
      this.loadedItemsArray = [];
      this.element.querySelector('.mediamanager-content__items-wrapper').innerHTML = '';
    }

    var removeSelectedItem = function (objectId) {
      var _tmpSelectedItemIndex = this.selectedItemsArray.indexOf(this.loadedItemsArray[objectId]);

      if (_tmpSelectedItemIndex > -1) {
        this.selectedItemsArray.splice(_tmpSelectedItemIndex, 1);
      }
    }

    var removeItem = function (objectId) {
      var _tmpItemIndex = this.loadedItemsArray.indexOf(this.loadedItemsArray[objectId]);

      if (_tmpItemIndex > -1) {
        this.loadedItemsArray.splice(objectId, 1);
      }
    }

    var removeAllSelectedItem = function () {
      var _activeMediaItem = this.element.querySelectorAll('.mediamanager__item.--selected');
      for (var i = 0; i < _activeMediaItem.length; i++) {
        _activeMediaItem[i].classList.remove('--selected');
      }

      this.selectedItemsArray = [];
      this.element.querySelector('.mediamanager-content__footer-wrapper').classList.remove('--active');
      _updateSelectedItemElement.call(this);
    }

    var getItemExtensionType = function (data) {
      var _matchImage = new RegExp('jpg|png|gif'),
          _matchMusic = new RegExp('mp3|ogg|wav'),
          _matchVideo = new RegExp('mkv|flv|ogv|avi|mov|wmv|mp4|3gp'),
          _fileExtension = getFileExtension(data.filename),
          _fileType = 'etc';

      if (_matchImage.test(_fileExtension)) {
        _fileType = 'image';
      } else if (_matchMusic.test(_fileExtension)) {
        _fileType = 'music';
      } else if (_matchVideo.test(_fileExtension)) {
        _fileType = 'video';
      }

      return _fileType;
    }

    var getFileExtension = function (filename) {
      return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    var deleteItem = function (element, objectId) {
      var _request = new XMLHttpRequest(),
          data = {
            totalItems: this.loadedItemsArray.length,
            itemObject: this.loadedItemsArray[objectId]
          },
          formdata = null,
          _ = this,
          _mediaManagerWrapper = this.element.querySelector('.mediamanager-content__items-wrapper');

      formdata = _ajaxFormatParams(data).slice(0, -1 );

      _request.open('POST', this.options.deleteItemUrl, true);
      _request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

      _request.onload = function() {

        if (_request.status >= 200 && _request.status < 400) {
          removeSelectedItem.call(_, objectId);
          _mediaManagerWrapper.removeChild(element);
          removeItem.call(_, objectId);
          _updateSelectedItemElement.call(_);

        } else {
            console.log('"delete item error" - We reached our target server, but it returned an error');
        }
      };

      _request.send(formdata);
    }

    var _updateSelectedItemElement = function () {
      var _selectedIemElement = this.element.querySelector('.item-counter-count');

      _selectedIemElement.innerHTML = this.selectedItemsArray.length;

      if (this.selectedItemsArray.length > 0) {
        this.element.querySelector('.mediamanager-content__footer-wrapper').classList.add('--active');
      } else {
        this.element.querySelector('.mediamanager-content__footer-wrapper').classList.remove('--active');
      }
    }

    var _buildBackdropLayer = function () {

      // If backdrop layer is not created, make just one
      if (document.querySelectorAll('.backdrop-layer').length == 0) {
        var _backdrop = document.createElement('div');
        _backdrop.classList.add('backdrop-layer');

        this.element.parentNode.appendChild(_backdrop);
      }
    }

    var _buildHeader = function () {
      
      var _mediamanagerHeaderElement = document.createElement('div'),
          _mediamanagerHeaderElementLeft = document.createElement('div'),
          _mediamanagerHeaderElementRight = document.createElement('div'),
          _mediamanagerHeaderLeftItemElementMediamanager = document.createElement('div'),
          _mediamanagerHeaderLeftItemElementUpload = document.createElement('div'),
          _mediamanagerHeaderRightItemCounter = document.createElement('div'),
          _mediamanagerHeaderRightItemCounterCount = document.createElement('span'),
          _mediamanagerHeaderRightItemSelected = document.createElement('div');

      _mediamanagerHeaderElement.classList.add('mediamanager__header-wrapper');

      _mediamanagerHeaderElementLeft.classList.add('mediamanager-header__left-wrapper');
      // Build Mediamanager button
      _mediamanagerHeaderLeftItemElementMediamanager.classList.add('mediamanager-header-left__item');
      _mediamanagerHeaderLeftItemElementMediamanager.classList.add('mediamanager-header__button');
      _mediamanagerHeaderLeftItemElementMediamanager.classList.add('--selected');
      _mediamanagerHeaderLeftItemElementMediamanager.setAttribute('target', '.mediamanager__content-wrapper');
      _mediamanagerHeaderLeftItemElementMediamanager.innerHTML = 'Mediamanager';

      // If uploadUrl is speficied and dropzone is present, enable upload feature 
      if (this.isDropzone && this.options.uploadUrl) {
        // Build Upload button
        _mediamanagerHeaderLeftItemElementUpload.classList.add('mediamanager-header-left__item');
        _mediamanagerHeaderLeftItemElementUpload.classList.add('mediamanager-header__upload-button');
        _mediamanagerHeaderLeftItemElementUpload.setAttribute('target', '.mediamanager__upload-wrapper');
        _mediamanagerHeaderLeftItemElementUpload.innerHTML = 'Upload';
      }

      _mediamanagerHeaderElementRight.classList.add('mediamanager-header__right-wrapper');
      _mediamanagerHeaderRightItemCounter.classList.add('mediamanager-header-right__item-counter');
      _mediamanagerHeaderRightItemCounter.innerHTML = 'Item selected:';
      _mediamanagerHeaderRightItemCounterCount.classList.add('item-counter-count');
      _mediamanagerHeaderRightItemCounterCount.innerHTML = '0';
      _mediamanagerHeaderRightItemSelected.classList.add('mediamanager-header-right__item-clear-selected');
      _mediamanagerHeaderRightItemSelected.innerHTML = 'Clear Selected';

      _mediamanagerHeaderElementLeft.appendChild(_mediamanagerHeaderLeftItemElementMediamanager);
      _mediamanagerHeaderElementLeft.appendChild(_mediamanagerHeaderLeftItemElementUpload);

      _mediamanagerHeaderElementRight.appendChild(_mediamanagerHeaderRightItemCounter);
      _mediamanagerHeaderRightItemCounter.appendChild(_mediamanagerHeaderRightItemCounterCount);
      _mediamanagerHeaderElementRight.appendChild(_mediamanagerHeaderRightItemSelected);

      _mediamanagerHeaderElement.appendChild(_mediamanagerHeaderElementRight);
      _mediamanagerHeaderElement.appendChild(_mediamanagerHeaderElementLeft);

      this.element.appendChild(_mediamanagerHeaderElement);
    }

    var _buildFooter = function () {
      var _mediamanagerFooterElement = document.createElement('div'),
          _mediamanagerFooterButtonElement = document.createElement('div');

      _mediamanagerFooterButtonElement.classList.add('mediamanager-content-footer__insert-to-post-button');
      _mediamanagerFooterButtonElement.appendChild(document.createTextNode(this.options.buttonText));

      _mediamanagerFooterElement.classList.add('mediamanager-content__footer-wrapper');
      _mediamanagerFooterElement.appendChild(_mediamanagerFooterButtonElement);

      return _mediamanagerFooterElement;
    }

    var _buildItemWrapper = function () {
      var _mediamanagerItemWrapper = document.createElement('div');

      _mediamanagerItemWrapper.classList.add('mediamanager-content__items-wrapper');

      return _mediamanagerItemWrapper;
    }

    function Mediamanager(options) {
        this.options = extend(defaults, options);
        this.element = document.createElement('div');

        var findMediamanagerWrapper = document.querySelector('#' + this.options.wrapperId),
            mediaManagerCount = document.querySelectorAll('.mediamanager-wrapper').length;

        if (mediaManagerCount == 0) {
          this.element.setAttribute('id', this.options.wrapperId);
        } else {
          this.element.setAttribute('id', this.options.wrapperId + mediaManagerCount+1);
        }

        document.getElementsByTagName('body')[0].appendChild(this.element);

        this.loadedItemsArray = [];
        this.selectedItemsArray = [];
        this.isDropzone = false;
        this.Dropzone = null;

        if (window.Dropzone) {
          this.isDropzone = true;
        }

        //init code goes here
        build.call(this);
        initializeEvents.call(this);
    }

    // Plugin prototype
    Mediamanager.prototype = {

      // Open mediamanager
      open: function () {
        document.querySelector('body').classList.add('--mediamanager');
        this.element.classList.add('--active');
        this.element.parentNode.querySelector('.backdrop-layer').classList.add('--active');
        this.mediaManagerActive = true;
      },

      // Close mediamanager
      close: function () {
        document.querySelector('body').classList.remove('--mediamanager');
        removeAllSelectedItem.call(this);
        this.element.classList.remove('--active');
        this.element.parentNode.querySelector('.backdrop-layer').classList.remove('--active');
        this.mediaManagerActive = false;
      }
    };

    return Mediamanager;
}));