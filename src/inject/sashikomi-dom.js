import cssPath from 'css-path';
import util from './../util.js';

export default class SashikomiDOM {
  constructor(memo) {
    if (!!memo) {
      try {
        this.targetElm = document.querySelector(memo.targetElmPath);
        this.targetElmPath = memo.targetElmPath;
        this.generateProps();
      } catch (e) {
        this.hasError(e);
      }
    } else {
      try {
        const selection = window.getSelection();
        this.targetElmPath = cssPath(selection.getRangeAt(0).endContainer.parentNode);
        this.targetElm = document.querySelector(this.targetElmPath);
        this.generateProps();
      } catch (e) {
        this.hasError(e);
      }
    }
  }

  get alertMessage() {
    return chrome.i18n.getMessage('alert_insert_warn');
  }


  hasError(e) {
    throw new Error(e);
  }

  generateProps() {
    this.containerElm = document.createElement('div');
    this.containerElmId = util.uuid();
    this.url = util.removeUrlHash(location.href);

    this.containerElm.setAttribute('id', this.containerElmId);
    this.containerElm.dataset.sashikomi = 'true';
  }

  exists() {
    const target = this.targetElm.lastChild;
    return target.nodeType === 1 && target.getAttribute('data-sashikomi');
  }


  setInsertPoint() {
    this.targetElm.appendChild(this.containerElm);
  }

  insert() {
    try {
      this.setInsertPoint();
    } catch (e) {
      this.hasError(e);
    }
  }
}
