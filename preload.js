const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  selectMusicFolder: () => ipcRenderer.invoke('select-music-folder'),
  getMusicFiles: (folderPath) => ipcRenderer.invoke('get-music-files', folderPath),
});
