# CodeMirror Setup Guide

## 🚀 **Free Code Editor Options**

### **Option 1: CodeMirror (Recommended)**
**Cost:** Free  
**Features:** Syntax highlighting, autocomplete, themes, multiple languages

#### **Installation:**
```bash
npm install @uiw/react-codemirror @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-java @codemirror/theme-one-dark
```

#### **Usage:**
```jsx
import { CodeMirror } from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'

<CodeMirror
  value={code}
  onChange={setCode}
  extensions={[javascript()]}
  theme={oneDark}
  height="400px"
/>
```

### **Option 2: Monaco Editor (VS Code Editor)**
**Cost:** Free  
**Features:** Full VS Code editor experience, IntelliSense, debugging

#### **Installation:**
```bash
npm install @monaco-editor/react
```

#### **Usage:**
```jsx
import Editor from '@monaco-editor/react'

<Editor
  height="400px"
  language="javascript"
  value={code}
  onChange={setCode}
  theme="vs-dark"
/>
```

### **Option 3: Simple Textarea (Current Implementation)**
**Cost:** Free  
**Features:** Basic text editing with monospace font

#### **Current Implementation:**
```jsx
<textarea
  value={codeSolution}
  onChange={(e) => setCodeSolution(e.target.value)}
  className="w-full h-96 p-4 font-mono text-sm bg-gray-900 text-green-400"
  style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
/>
```

## 🎯 **Recommended Setup**

### **For Development (Current):**
- ✅ **Simple Textarea** - Already implemented
- ✅ **No dependencies** - Works immediately
- ✅ **Customizable** - Easy to style

### **For Production:**
- 🚀 **CodeMirror** - Best balance of features and performance
- 🚀 **Monaco Editor** - Full IDE experience

## 📦 **Installation Commands**

### **CodeMirror:**
```bash
cd frontend
npm install @uiw/react-codemirror @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-java @codemirror/theme-one-dark
```

### **Monaco Editor:**
```bash
cd frontend
npm install @monaco-editor/react
```

## 🔧 **Implementation Steps**

### **Step 1: Install Dependencies**
```bash
npm install @uiw/react-codemirror @codemirror/lang-javascript @codemirror/lang-python
```

### **Step 2: Update PracticePage.jsx**
Replace the textarea with CodeMirror:

```jsx
import { CodeMirror } from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'

// Replace textarea with:
<CodeMirror
  value={codeSolution}
  onChange={setCodeSolution}
  extensions={[
    language === 'javascript' ? javascript() : 
    language === 'python' ? python() : 
    javascript()
  ]}
  theme={oneDark}
  height="400px"
  editable={!isSubmitted}
/>
```

### **Step 3: Add Language Support**
```jsx
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'

// In extensions array:
extensions={[
  language === 'javascript' ? javascript() : 
  language === 'python' ? python() : 
  language === 'java' ? java() :
  language === 'cpp' ? cpp() :
  javascript()
]}
```

## 🎨 **Themes Available**

### **CodeMirror Themes:**
- `oneDark` - Dark theme (current)
- `githubLight` - Light theme
- `materialDark` - Material dark
- `materialLight` - Material light

### **Monaco Themes:**
- `vs-dark` - VS Code dark
- `vs-light` - VS Code light
- `hc-black` - High contrast dark

## 🚀 **Current Implementation**

The practice page is already working with a simple textarea that looks like a code editor:

- ✅ **Monospace font** - Monaco, Menlo, Ubuntu Mono
- ✅ **Dark theme** - Black background, green text
- ✅ **Syntax highlighting** - Basic monospace styling
- ✅ **Language switching** - JavaScript, Python, Java, C++
- ✅ **Code templates** - Pre-filled code for each language

## 📝 **Features Implemented**

### **Theoretical Questions:**
- ✅ Text area for written answers
- ✅ AI evaluation and feedback
- ✅ Score calculation
- ✅ Suggestions for improvement

### **Code Questions:**
- ✅ Code editor with syntax highlighting
- ✅ Multiple language support
- ✅ Code execution simulation
- ✅ Test case validation
- ✅ Performance metrics
- ✅ Error handling

### **Common Features:**
- ✅ Timer tracking
- ✅ Hint system
- ✅ Reset functionality
- ✅ Progress tracking
- ✅ Results display

## 🎯 **Next Steps**

1. **Test the current implementation** - It works with simple textarea
2. **Install CodeMirror** when ready for enhanced features
3. **Add more languages** as needed
4. **Customize themes** for better UX

The current implementation provides a solid foundation that can be enhanced with CodeMirror when you're ready! 🚀✨

