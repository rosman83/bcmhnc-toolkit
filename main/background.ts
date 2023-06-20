import { app, dialog, ipcMain } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import XPRA from './scripts/xpra';
import SSGSEA from './scripts/ssgsea';
import fs from 'fs';
import InitSettings from './helpers/settings';

import settings from 'electron-settings';

const isProd: boolean = process.env.NODE_ENV === 'production';


if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();
  await InitSettings();

  ipcMain.handle('get-settings', async (event, key) => {
    const settings_obj = await settings.get(key);
    return settings_obj;
  })

  ipcMain.handle('set-settings', async (event, key, value) => {
    await settings.set(key, value);
  })

  ipcMain.on('xpra-message', async (event, args) => {
    try {
      const response: any = await XPRA(args, mainWindow);
      return event.sender.send('xpra-reply', {
        success: true,
        file: response.message,
      })
    } catch (e) {
      return event.sender.send('xpra-reply', {
        success: false,
        error: e.message,
      })
    };
  })

  ipcMain.on('ssgsea-message', async (event, args) => {
    const response = await SSGSEA(args);
    event.sender.send('ssgsea-reply', {
      time: new Date(),
      success: response.success,
      file: response.file,
    })
  })

  ipcMain.on('save-file', async (event, args) => {
    // show window to save the file with file being arg.content, filters being arg.filters, defaultPath being arg.defaultPath, and title of window being arg.title
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: args.defaultPath,
      filters: args.filters,
      title: args.title,
    });

    // write the file to the path
    fs.writeFile(filePath, args.content, (err) => {
      if (err) {
        dialog.showMessageBox({
          type: 'error',
          title: 'Error',
          message: 'An error occurred while saving the file.',
          detail: err.message,
        });
      }
    });
  })

  const mainWindow = createWindow('main', {
    width: 900,
    height: 700,
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home.html');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on('window-all-closed', () => {
  app.quit();
});
