import {App, Plugin, PluginManifest} from 'obsidian';
import {IndexContentProcessorModule} from "./modules/IndexContentProcessorModule";
import {GraphManipulatorModule} from "./modules/GraphManipulatorModule";
import {DEFAULT_SETTINGS, PluginSetting, PluginSettingsTab} from "./models/PluginSettingsTab";
import {FolderNoteModule} from "./modules/FolderNoteModule";
import {ContextMenuModule} from "./modules/ContextMenuModule";
import CustomEventTarget from "./modules/CustomEventTarget";

// Remember to rename these classes and interfaces!
export default class FolderIndexPlugin extends Plugin {
	// @ts-ignore
	settings: PluginSetting;
	// @ts-ignore
	graphManipulator: GraphManipulatorModule | null;
	// @ts-ignore
	folderNodeModule: FolderNoteModule;
	// @ts-ignore
	eventManager: EventEmitter
	oldGraphSetting = false
	static PLUGIN: FolderIndexPlugin;
	// @ts-ignore
	private contextMenuModule: ContextMenuModule;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		FolderIndexPlugin.PLUGIN = this;
	}

	async onload() {
		// eslint-disable-next-line no-console
		console.log("Loading FolderTableContent")
		this.eventManager = new CustomEventTarget()

		await this.loadSettings();

		//TODO: Remove once fixed
		this.settings.hideIndexFiles = false;
		await this.saveSettings();

		this.oldGraphSetting = this.settings.graphOverwrite;
		this.addSettingTab(new PluginSettingsTab(this.app, this));

		this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this))
		this.registerEvent(this.app.workspace.on("layout-change", this.onLayoutChange.bind(this)))
		this.eventManager.on("settingsUpdate", this.onSettingsUpdate.bind(this))

		this.registerMarkdownCodeBlockProcessor("folder-index-content", (source, el, ctx) => {
			ctx.addChild(new IndexContentProcessorModule(this.app, this, ctx.sourcePath, el, source))
		})

		this.folderNodeModule = new FolderNoteModule(this.app, this)
		if (this.settings.graphOverwrite) {
			this.graphManipulator = new GraphManipulatorModule(this.app, this)
		}

		this.contextMenuModule = new ContextMenuModule(this.app, this);
		this.contextMenuModule.addFolderContextMenu();
	}

	onSettingsUpdate() {
		if (this.settings.graphOverwrite != this.oldGraphSetting) {
			if (this.settings.graphOverwrite) {
				this.graphManipulator = new GraphManipulatorModule(this.app, this)
			} else {
				if (this.graphManipulator)
					this.graphManipulator.unload()
			}
			this.oldGraphSetting = this.settings.graphOverwrite
		}
	}

	onLayoutChange() {
		this.eventManager.emit("onLayoutChange")
	}

	onLayoutReady() {
		this.eventManager.emit("onLayoutReady")
	}

	async onunload() {
		// eslint-disable-next-line no-console
		console.log("Unloading FolderTableContent")
		this.eventManager.removeAllListeners()
		if (this.graphManipulator != null) {
			this.graphManipulator.unload()
		}
		this.folderNodeModule.unload()
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.eventManager.emit("settingsUpdate", this.settings);
	}
}
