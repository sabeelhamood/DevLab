/**
 * Unified CodeMirror bundle served from the backend so the iframe can import
 * everything (state, view, languages, themes) from a single module.
 * This prevents multiple copies of @codemirror/state from being instantiated.
 */

import { EditorState } from "https://esm.sh/@codemirror/state@6.5.2";
import { EditorView, basicSetup } from "https://esm.sh/@codemirror/basic-setup@0.20.0";

// Languages
import { javascript } from "https://esm.sh/@codemirror/lang-javascript@6.2.4";
import { python } from "https://esm.sh/@codemirror/lang-python@6.2.1";
import { cpp } from "https://esm.sh/@codemirror/lang-cpp@6.0.3";
import { java } from "https://esm.sh/@codemirror/lang-java@6.0.2";
import { rust } from "https://esm.sh/@codemirror/lang-rust@6.0.1";
import { go } from "https://esm.sh/@codemirror/lang-go@6.0.1";
import { php } from "https://esm.sh/@codemirror/lang-php@6.1.3";
import { dart } from "https://esm.sh/@codemirror/lang-dart@6.1.2";
import { swift } from "https://esm.sh/@codemirror/lang-swift@6.0.1";
import { sql } from "https://esm.sh/@codemirror/lang-sql@6.5.2";
import { html } from "https://esm.sh/@codemirror/lang-html@6.5.2";
import { css } from "https://esm.sh/@codemirror/lang-css@6.2.1";
import { xml } from "https://esm.sh/@codemirror/lang-xml@6.1.0";
import { json } from "https://esm.sh/@codemirror/lang-json@6.0.1";
import { markdown } from "https://esm.sh/@codemirror/lang-markdown@6.2.4";
import { yaml } from "https://esm.sh/@codemirror/lang-yaml@6.1.1";
import { wast } from "https://esm.sh/@codemirror/lang-wast@6.0.1";
import { lezer } from "https://esm.sh/@codemirror/lang-lezer@6.0.1";

// Themes
import { oneDark } from "https://esm.sh/@codemirror/theme-one-dark@6.1.3";

export const languageExtensions = {
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  jsx: () => javascript({ jsx: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  python: () => python(),
  cpp: () => cpp(),
  c: () => cpp(),
  java: () => java(),
  rust: () => rust(),
  go: () => go(),
  php: () => php(),
  dart: () => dart(),
  swift: () => swift(),
  sql: () => sql(),
  html: () => html(),
  css: () => css(),
  xml: () => xml(),
  json: () => json(),
  markdown: () => markdown(),
  yaml: () => yaml(),
  wast: () => wast(),
  lezer: () => lezer()
};

export const themeExtensions = {
  light: [],
  oneDark: [oneDark]
};

export {
  EditorState,
  EditorView,
  basicSetup
}

