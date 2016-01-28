import * as store from './store'
export default (function () {

  chrome.runtime.onMessage.addListener(
    function (req, sender, sendResponse) {
      switch (req.type) {
        case "PUT":
          putMemo(req, sendResponse);
          _validatePageAction(sender);
          return true;
          break;
        case "DELETE":
          deleteMemo(req, sendResponse);
          _validatePageAction(sender);
          return true;
          break;
        case "HAS_INSERTION_ERRORS":
          changePageActionToErrorIcon(req, sender);
          addFlag(req);
          return true;
          break;
        default:
          console.log("Error: Unknown request.");
          console.log(req);
      }
    }
  );


  function putMemo(req, res) {
    store.save(req.data)
      .then(data =>res({ status: 'success', data: data }))
      .catch(err => res({ status: 'error', errorMessage: err }));
  }

  function deleteMemo(req, res) {
    store.remove(req.data)
      .then(res({ status: 'success' }))
      .catch(res({ status: 'error' }))
  }

  function changePageActionToErrorIcon(req, sender) {
    chrome.pageAction.setTitle({
      tabId: sender.tab.id,
      title: `Sashikomi has insertion error(${req.data.length})`
    });
    chrome.pageAction.setIcon({
      tabId: sender.tab.id,
      path: "icons/icon19_error.png"
    })
  }

  function addFlag(req) {
    store.addInsertionErrorFlag(req.data)
  }


  function _validatePageAction(sender) {
    /*
    *  memoの数に応じて、page actionを操作
    *  memoのurlでmemoのカウントを調べる
    *  memoがあればpageAction.show
    *  なければhide
    *  putMemoとdeleteMemoのタイミングで実行
    */
    let url = sender.url;
    let tabId = sender.tab.id;

    store.getMemosByUrl(url)
      .then(data => {
        if (data.length) {
          chrome.pageAction.show(tabId)
        } else {
          chrome.pageAction.hide(tabId)
        }
      })
  }
})();