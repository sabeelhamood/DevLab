import fs from "fs";
import path from "path";

export const codeMirrorLoader = {
    /**
     * מחזיר את תבנית CodeMirror HTML כ-string
     */
    loadTemplate() {
        const filePath = path.join(
            process.cwd(),
            "src",
            "utils",
            "codemirrorTemplate.html"
        );
        return fs.readFileSync(filePath, "utf8");
    }
};
