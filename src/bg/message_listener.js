import * as store from './store';
export default (() => {
  function putMemo(req, res) {
    store.save(req.data)
      .then(data => res({ status: 'success', data }))
      .catch(err => res({ status: 'error', errorMessage: err }));
  }

  function deleteMemo(req, res) {
    store.remove(req.data)
      .then(res({ status: 'success' }))
      .catch(res({ status: 'error' }));
  }

  function changePageActionToErrorIcon(req, sender) {
    chrome.pageAction.setTitle({
      tabId: sender.tab.id,
      title: `Sashikomi has insertion error(${req.data.length})`,
    });
    chrome.pageAction.setIcon({
      tabId: sender.tab.id,
      path: "icons/icon19_error.png",
    });
  }

  function addFlag(req) {
    store.addInsertionErrorFlag(req.data);
  }

  function getInsertionErrors(res) {
    const url = sessionStorage.insetionErrorURL;
    store.getInsertionErrorData(url)
      .then(data => {
        res({ status: 'success', data: { url, errors: data } });
      })
      .catch(e => console.error(e));
  }


  function validatePageAction(sender) {
    /*
    *  memoの数に応じて、page actionを操作
    *  memoのurlでmemoのカウントを調べる
    *  memoがあればpageAction.show, なければhide
    *  putMemoとdeleteMemoのタイミングで実行
    */
    const url = sender.url;
    const tabId = sender.tab.id;

    store.getMemosByUrl(url)
      .then(data => {
        if (data.length) {
          chrome.pageAction.show(tabId);
        } else {
          chrome.pageAction.hide(tabId);
        }
      });
  }

  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    switch (req.type) {
    case "PUT":
      putMemo(req, sendResponse);
      validatePageAction(sender);
      break;
    case "DELETE":
      deleteMemo(req, sendResponse);
      validatePageAction(sender);
      break;
    case "HAS_INSERTION_ERRORS":
      changePageActionToErrorIcon(req, sender);
      addFlag(req);
      break;
    case "GET_INSERTION_ERRORS":
      getInsertionErrors(sendResponse);
      break;
    default:
      console.log("Error: Unknown request.");
      console.log(req);
    }

    return true;
  });
})();
