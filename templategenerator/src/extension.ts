// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { existsSync, fstat, mkdir, mkdirSync, readFile, readFileSync, writeFileSync } from 'fs';
import { basename } from 'path';
import * as vscode from 'vscode';

interface TemplateFile {
	file: string;
	body: string[];
}

interface TemplateFolder {
	folder: string;
	files?: TemplateFile[];
	folders?: TemplateFolder[];
}

interface Template {
	templateName: string;
	files?: TemplateFile[];
	folders?: TemplateFolder[];
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const generateNewFolder = vscode.commands.registerCommand("templategenerator.createFolder", async (uri: vscode.Uri) => {
		const templateFiles = await vscode.workspace.findFiles("**/.vscode/fileTemplates.json");
		const templateOptionsFile = templateFiles[0].fsPath;

		if (!templateOptionsFile) {
			return vscode.window.showInformationMessage("You must create a file named fileTemplates.json in a .vscode folder");
		}

		await readFile(templateOptionsFile, "utf8", (err, data) => {
			if (err) {
				return vscode.window.showInformationMessage("An Error occurred reading the json file");
			}
			const templateOptions = JSON.parse(data);

			const userOptions = templateOptions.map((opt: any) => {
				return opt.templateName;
			});
	
			vscode.window.showQuickPick(userOptions)
				.then(res => {
					if (res) {
						const template = templateOptions.find((temp: any) => temp.templateName === res);
	
						if (template) {
							createFromTemplate(template, uri.fsPath);
						} else {
							vscode.window.showInformationMessage("An error occurred while creating a new folder");
						}
					}
				});
		});
		
	});

	context.subscriptions.push(generateNewFolder);
}

// this method is called when your extension is deactivated
export function deactivate() {}

const createFromTemplate = (template: Template, path: string) => {
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

const createNewFile = (file: TemplateFile, path: string, wsedit: vscode.WorkspaceEdit, baseName: string) => {
	const fileName = file.file.replace("{BASE_NAME}", baseName);

	const filePath = `${path}/${fileName}`;

	if (!existsSync(filePath)) {
		wsedit.createFile(vscode.Uri.file(filePath));
		vscode.workspace.applyEdit(wsedit).then(() => {
			writeNewFile(file, filePath, baseName);
		});
	}
};

/* creates new directory and returns undefined if folder already exists */
const createNewFolder = (path: string, wsedit: vscode.WorkspaceEdit, baseName: string, folder?: TemplateFolder) => {
	if (!folder) {
		return;
	}

	const dirName = folder.folder.replace("{BASE_NAME}", baseName)

	const dir = `${path}/${dirName}`;

	if (!existsSync(dir)) {
		mkdirSync(dir);

		folder.folders?.forEach(subDir => {
			createNewFolder(dir, wsedit, baseName, subDir);
		});

		folder.files?.forEach(file => {
			createNewFile(file, dir, wsedit, baseName);
		});

		return dir;
	} else {
		return undefined;
	}
};

const writeNewFile = (file: TemplateFile, path: string, baseName?: string) => {
	// new body arr after replacing any variables in strings
	const modifiedBody: string[] = [];

	if (file.body) {
		file.body?.forEach(line => {
			const newLine = line.replace("{BASE_NAME}", baseName ?? "");
			modifiedBody.push(newLine);
		});

		const fileContent = modifiedBody.join("\n");
	
		writeFileSync(path, fileContent);
	}
};