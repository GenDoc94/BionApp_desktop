import { contextBridge, ipcRenderer } from 'electron';
var api = {
    getState: function () { return ipcRenderer.invoke('app:getState'); },
    getDbActivity: function () { return ipcRenderer.invoke('app:getDbActivity'); },
    setLocale: function (locale) { return ipcRenderer.invoke('app:setLocale', locale); },
    pickDataFolder: function () { return ipcRenderer.invoke('app:pickDataFolder'); },
    setDataFolder: function (path, adminCode) {
        return ipcRenderer.invoke('app:setDataFolder', path, adminCode);
    },
    verifyAdminCode: function (adminCode) { return ipcRenderer.invoke('app:verifyAdminCode', adminCode); },
    login: function (email, password) { return ipcRenderer.invoke('auth:login', email, password); },
    logout: function () { return ipcRenderer.invoke('auth:logout'); },
    getSession: function () { return ipcRenderer.invoke('auth:session'); },
    getUser: function () { return ipcRenderer.invoke('auth:getUser'); },
    getSessionRole: function () { return ipcRenderer.invoke('auth:getSessionRole'); },
    createUserFn: function (method, body) {
        return ipcRenderer.invoke('fn:create-user', method, body);
    },
    dbRequest: function (req) { return ipcRenderer.invoke('db:request', req); },
    exportDatabase: function (format) {
        return ipcRenderer.invoke('export:database', format);
    },
    listDocumentos: function () { return ipcRenderer.invoke('docs:list'); },
    uploadDocumento: function (name, data) {
        return ipcRenderer.invoke('docs:upload', name, data);
    },
    deleteDocumento: function (name) {
        return ipcRenderer.invoke('docs:delete', name);
    },
    readDocumento: function (name) {
        return ipcRenderer.invoke('docs:read', name);
    },
    onDataChanged: function (cb) {
        var handler = function () { return cb(); };
        ipcRenderer.on('data:changed', handler);
        return function () { return ipcRenderer.removeListener('data:changed', handler); };
    },
    onAuthState: function (cb) {
        var handler = function (_e, user) { return cb(user); };
        ipcRenderer.on('auth:state', handler);
        ipcRenderer.send('auth:subscribe');
        return function () { return ipcRenderer.removeListener('auth:state', handler); };
    },
    restoreKeyboardFocus: function () { return ipcRenderer.invoke('app:restoreKeyboardFocus'); }
};
contextBridge.exposeInMainWorld('api', api);
