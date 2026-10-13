const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('whiteboardAPI', {
  getPid: () => ipcRenderer.invoke('wb-get-pid'),
  copyPid: () => ipcRenderer.invoke('wb-copy-pid'),
  submitCode: (code) => ipcRenderer.invoke('wb-submit-code', code),
  openPay: () => ipcRenderer.send('wb-open-pay'),
  requestActivation: () => ipcRenderer.send('wb-request-activation'),
  enterCode: () => ipcRenderer.send('wb-enter-code')
});
