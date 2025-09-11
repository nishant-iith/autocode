# 💾 AutoCode Autosave Feature

The AutoCode application now includes a comprehensive **autosave functionality** that automatically saves your files as you type, preventing data loss and improving the development experience.

## 🚀 Features

### ⚡ **Smart Autosave**
- **Automatic Saving**: Files are saved automatically after you stop typing
- **Debounced Saving**: Waits for a configurable delay before saving to avoid excessive API calls
- **Visual Feedback**: Real-time indicators show saving status and file state

### ⚙️ **Customizable Settings**
- **Enable/Disable**: Toggle autosave on or off
- **Adjustable Delay**: Choose from 1 second to 30 seconds delay
- **Persistent Settings**: Your preferences are saved across sessions

### 🎨 **Visual Indicators**
- **Status Bar**: Shows autosave status, delay settings, and last saved time
- **Editor Overlays**: Displays "Saving..." and "Unsaved changes" indicators
- **Loading Animations**: Smooth spinners indicate saving in progress

## 📋 How to Use

### 🖱️ **Quick Access via Status Bar**
1. Look at the **bottom status bar** of AutoCode
2. You'll see autosave status: `Autosave: 2s` or `Manual save`
3. Click the **"Settings"** button in the status bar to open preferences

### ⌨️ **Keyboard Shortcuts**
- **`Ctrl + ,`** - Open Settings modal
- **`Ctrl + Shift + P`** - Open Command Palette for quick autosave commands
- **`Ctrl + S`** - Force save (works with or without autosave)

### 📝 **Command Palette Actions**
Press **`Ctrl + Shift + P`** and search for:
- **"Enable Autosave"** / **"Disable Autosave"**
- **"Set Autosave Delay to [X] Seconds"**
- **"Open Settings"**

## ⚙️ Configuration Options

### 🔧 **Autosave Settings**
| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| **Enable Autosave** | On/Off | `On` | Master toggle for autosave functionality |
| **Autosave Delay** | 1s, 2s, 3s, 5s, 10s, 30s | `2s` | Time to wait after stopping typing |

### 🎯 **Access Settings**
1. **Status Bar**: Click "Settings" button
2. **Command Palette**: `Ctrl + Shift + P` → "Open Settings"
3. **Keyboard**: `Ctrl + ,`

## 📊 Visual Indicators

### 📍 **Status Bar (Bottom)**
```
✅ AutoCode Ready | 💾 Autosave: 2s | 📄 JS | Lines: 42 | Chars: 1,234 | index.js | Just saved | ⚙️ Settings
```

**Status Meanings:**
- **`Autosave: 2s`** - Autosave enabled with 2-second delay
- **`Manual save`** - Autosave disabled
- **`Saving...`** - File is currently being saved
- **`Just saved`** - File was saved within the last minute
- **`Saved 3m ago`** - Last save time for reference

### 🔮 **Editor Overlays (Top Right)**
- **🔄 "Saving..."** - Animated spinner when saving
- **⚠️ "Unsaved changes"** - Orange indicator for dirty files

## 🛠️ Technical Implementation

### 🏗️ **Architecture**
- **Custom Hook**: `useAutosave` handles debouncing and save logic
- **State Management**: Zustand store for autosave settings
- **Smart Debouncing**: Cancels previous saves when new changes occur
- **Error Handling**: Graceful failure handling with user feedback

### 📡 **API Integration**
- **Automatic API Calls**: Saves to `/api/files/content/{workspaceId}/{path}`
- **Error Recovery**: Retries failed saves and shows error states
- **WebSocket Updates**: Real-time synchronization across tabs

### 🎯 **Performance Features**
- **Debounced Saves**: Prevents excessive API calls
- **Smart Scheduling**: Only saves when content actually changes
- **Cancel Pending**: Cancels outdated save requests
- **Memory Efficient**: Minimal state tracking

## 🔧 Code Examples

### 🎯 **Using the Autosave Hook**
```typescript
import { useAutosave } from '../hooks/useAutosave';

const MyEditor = () => {
  const { scheduleAutosave, forceSave, isSaving } = useAutosave();
  
  const handleChange = (content: string) => {
    // Schedule autosave when content changes
    scheduleAutosave(filePath, content);
  };
  
  const handleManualSave = async () => {
    // Force immediate save
    await forceSave();
  };
};
```

### ⚙️ **Accessing Settings**
```typescript
import { useEditorStore } from '../store/editorStore';

const MyComponent = () => {
  const { 
    autosaveEnabled, 
    autosaveDelay, 
    toggleAutosave, 
    setAutosaveDelay 
  } = useEditorStore();
  
  return (
    <div>
      <button onClick={toggleAutosave}>
        {autosaveEnabled ? 'Disable' : 'Enable'} Autosave
      </button>
      <select 
        value={autosaveDelay} 
        onChange={(e) => setAutosaveDelay(Number(e.target.value))}
      >
        <option value={1000}>1 second</option>
        <option value={2000}>2 seconds</option>
        <option value={5000}>5 seconds</option>
      </select>
    </div>
  );
};
```

## 🎬 User Experience Flow

### 📝 **Typical Editing Session**
1. **Open a file** → File loads in editor
2. **Start typing** → Content changes, file marked as "dirty"
3. **Stop typing** → Autosave countdown begins (e.g., 2 seconds)
4. **During countdown** → Status shows "Unsaved changes"
5. **Countdown complete** → "Saving..." indicator appears
6. **Save success** → File marked as clean, "Just saved" status
7. **Continue editing** → Process repeats automatically

### ⚙️ **Settings Workflow**
1. **Open Settings** → `Ctrl + ,` or status bar button
2. **Modify Settings** → Toggle autosave, adjust delay
3. **Save Settings** → Changes applied immediately
4. **Visual Update** → Status bar reflects new settings

## 🔍 Troubleshooting

### ❓ **Common Issues**

**Q: Autosave isn't working**
- ✅ Check if autosave is enabled in settings
- ✅ Verify you have an active project open
- ✅ Ensure the file has unsaved changes

**Q: Files are saving too frequently**
- ✅ Increase the autosave delay in settings
- ✅ Try 5-10 second delays for slower connections

**Q: Want to disable autosave completely**
- ✅ Open Settings (`Ctrl + ,`)
- ✅ Toggle "Enable Autosave" to Off
- ✅ Use `Ctrl + S` for manual saving

**Q: Lost unsaved work**
- ✅ Check the "last saved" timestamp in status bar
- ✅ Files may have been auto-saved more recently than expected
- ✅ Use browser dev tools to check for API errors

## 🎨 Customization

The autosave feature is designed to be:
- **🎯 Non-intrusive**: Works silently in the background
- **⚡ Fast**: Minimal impact on editor performance  
- **🔧 Configurable**: Adjustable to your workflow
- **👀 Visible**: Clear feedback on save status

## 🚀 Future Enhancements

Planned improvements include:
- **📱 Mobile optimization** for touch devices
- **🔄 Conflict resolution** for concurrent edits
- **📦 Offline support** with queue-based saving
- **🎛️ Per-project settings** for different workflows
- **📊 Save analytics** and usage insights

---

**💡 Pro Tips:**
- Use shorter delays (1-2s) for active development
- Use longer delays (5-10s) for documentation writing
- Monitor the status bar for real-time save feedback
- Use `Ctrl + S` anytime to force an immediate save

**🎯 The autosave feature makes AutoCode even more reliable and user-friendly, ensuring your code is always safe!** 🚀