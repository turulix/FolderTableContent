import { TFolder, Menu, Notice, App } from 'obsidian';
import FolderIndexPlugin from "../main";

export class ContextMenuModule {
    constructor(private app: App, private plugin: FolderIndexPlugin) {
    }

    addFolderContextMenu() {
        this.app.workspace.on("file-menu", (menu, folder) => {
            if (folder instanceof TFolder) {
                const indexFileForFolder = this.getIndexFileForFolder(folder.path)

                if (this.doesIndexFileExistForFolder(indexFileForFolder) != null) {
                    menu.addItem((item) => {
                        item.setTitle("Create Index File")
                            .setIcon("any-icon")
                            .onClick(() => this.createIndexFileForFolder(indexFileForFolder));
                    });
                }
            }
        });
    }

    private doesIndexFileExistForFolder(fullPath:string): boolean {
        return this.app.vault.getAbstractFileByPath(fullPath) != null
    }

    private getIndexFileForFolder(path:string): string {
        let indexFilename = (this.plugin.settings.indexFileUserSpecified) 
            ? this.plugin.settings.indexFilename 
            : path.split("/").pop() || ""
        return path + "/" + indexFilename + ".md";
    }

    private async createIndexFileForFolder(indexFileForFolder: string) {
        const filePath = indexFileForFolder.substring(0, indexFileForFolder.lastIndexOf("/"))
        try {
            // Create a new markdown file
            const newFile = await this.app.vault.create(indexFileForFolder, "# New File Content");

            // Notify the user
            new Notice(`File "${newFile.name}" created successfully in folder "${newFile.path}".`);
            console.log(`File created at path: ${newFile.path}`);
        } catch (error) {
            console.error(`Failed to create file at path: ${filePath}`, error);
            new Notice("Failed to create file. See console for details.");
        }
    }
}