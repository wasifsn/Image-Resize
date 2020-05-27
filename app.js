const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  ipcMain,
  shell,
} = require("electron");
const path = require("path");
const os = require("os");
const imageMin = require("imagemin");
const imageMinMoz = require("imagemin-mozjpeg");
const imageMinPNQ = require("imagemin-pngquant");
const slash = require("slash");
//set node env
process.env.NODE_ENV = "development";

const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;
let aboutWindow;

function creatAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: 300,
    height: 300,
    title: "About ImageResize",
    icon: "./assets/icons/Icon_256x256.png",
    resizable: false,
  });
  aboutWindow.loadFile(`./app/about.html`);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: isDev ? 800 : 500,
    height: 600,
    title: "Image Resize",
    icon: "./assets/icons/Icon_256x256.png",
    resizable: isDev ? true : false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  // mainWindow.loadURL(`file://${__dirname}/app/index.html`);
  mainWindow.loadFile(`./app/index.html`);
}

ipcMain.on("image:shrink", (e, options) => {
  options.destination = path.join(os.homedir(), "images_shrinked");
  imageResize(options);
});

async function imageResize({ path, quality, destination }) {
  try {
    const pngQuality = quality / 100;
    console.log(slash(path), quality, destination);
    const files = await imageMin([slash(path)], {
      destination,
      plugins: [
        imageMinMoz({ quality }),
        imageMinPNQ({
          quality: [pngQuality, pngQuality],
        }),
      ],
    });
    console.log(files);
    shell.openPath(destination);
    mainWindow.webContents.send("image:shrinked");
  } catch (e) {
    console.log(e);
  }
}
app.on("ready", () => {
  createMainWindow();
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);
  globalShortcut.register(isMac ? "Command+Alt+i" : "Ctrl+Shift+i", () => {
    mainWindow.toggleDevTools();
  });
  if (isDev) mainWindow.webContents.openDevTools();
  // globalShortcut.register("CmdorCtrl+R", () => {
  //   mainWindow.reload();
  // });
  // mainWindow.on("ready", () => {
  //   mainWindow = null;
  // });
});

const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [{ label: "About", click: creatAboutWindow }],
        },
      ]
    : []),
  ...(!isMac
    ? [
        {
          label: "Info",
          submenu: [{ label: "About", click: creatAboutWindow }],
        },
      ]
    : []),
  { role: "fileMenu" },
  ...(isDev
    ? [
        {
          label: "Dev",
          submenu: [
            { role: "reload" },
            { role: "forceReload" },
            { type: "separator" },
            { role: "toggledevtools" },
          ],
        },
      ]
    : []),
];

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
