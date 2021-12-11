"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const fs_1 = require("fs");
const vscode = require("vscode");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const helloWord = vscode.commands.registerCommand('templategenerator.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from TemplateGenerator!');
    });
    const generateNewFolder = vscode.commands.registerCommand("templategenerator.createFolder", async (uri) => {
        const templateFiles = await vscode.workspace.findFiles("**/.vscode/fileTemplates.json");
        const templateOptionsFile = templateFiles[0].fsPath;
        if (!templateOptionsFile) {
            return vscode.window.showInformationMessage("You must create a file named fileTemplates.json in a .vscode folder");
        }
        await (0, fs_1.readFile)(templateOptionsFile, "utf8", (err, data) => {
            if (err) {
                return vscode.window.showInformationMessage("An Error occurred reading the json file");
            }
            const templateOptions = JSON.parse(data);
            const userOptions = templateOptions.map((opt) => {
                return opt.templateName;
            });
            vscode.window.showQuickPick(userOptions)
                .then(res => {
                if (res) {
                    const template = templateOptions.find((temp) => temp.templateName === res);
                    if (template) {
                        createFromTemplate(template, uri.fsPath);
                    }
                    else {
                        vscode.window.showInformationMessage("An error occurred while creating a new folder");
                    }
                }
            });
        });
    });
    context.subscriptions.push(generateNewFolder, helloWord);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
const createFromTemplate = (template, path) => {
    const wsedit = new vscode.WorkspaceEdit();
    if (template.folders) {
        template.folders.forEach(dir => {
            createNewFolder(path, wsedit, "Hello", dir);
        });
    }
    template.files?.forEach(file => {
        createNewFile(file, path, wsedit, "Hello");
    });
    vscode.workspace.applyEdit(wsedit);
};
const createNewFile = (file, path, wsedit, baseName) => {
    const fileName = file.file.replace("{BASE_NAME}", baseName);
    const filePath = `${path}/${fileName}`;
    if (!(0, fs_1.existsSync)(filePath)) {
        wsedit.createFile(vscode.Uri.file(filePath));
        vscode.workspace.applyEdit(wsedit).then(() => {
            writeNewFile(file, filePath, baseName);
        });
    }
};
/* creates new directory and returns undefined if folder already exists */
const createNewFolder = (path, wsedit, baseName, folder) => {
    if (!folder) {
        return;
    }
    const dirName = folder.folder.replace("{BASE_NAME}", baseName);
    const dir = `${path}/${dirName}`;
    if (!(0, fs_1.existsSync)(dir)) {
        (0, fs_1.mkdirSync)(dir);
        folder.folders?.forEach(subDir => {
            createNewFolder(dir, wsedit, baseName, subDir);
        });
        folder.files?.forEach(file => {
            createNewFile(file, dir, wsedit, baseName);
        });
        return dir;
    }
    else {
        return undefined;
    }
};
const writeNewFile = (file, path, baseName) => {
    // new body arr after replacing any variables in strings
    const modifiedBody = [];
    if (file.body) {
        file.body?.forEach(line => {
            const newLine = line.replace("{BASE_NAME}", baseName ?? "");
            modifiedBody.push(newLine);
        });
        const fileContent = modifiedBody.join("\n");
        (0, fs_1.writeFileSync)(path, fileContent);
    }
};
//# sourceMappingURL=extension.js.map