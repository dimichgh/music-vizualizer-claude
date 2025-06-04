import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  audioFileApi: {
    openWavFile: async () => {
      return await ipcRenderer.invoke('open-wav-file');
    },
  },
});