import * as store from './store'
export default (function () {

  chrome.runtime.onMessage.addListener(
    function (req, sender, sendResponse) {

      switch (req.type) {
        case "PUT":
          putMemo(req, sendResponse);
          return true;
          break;
        case "DELETE":
          deleteMemo(req, sendResponse);
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
})();