const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'node_modules/@excalidraw/excalidraw/dist/prod/index.css');
const outputPath = path.join(__dirname, 'src/features/system-design/components/ExcalidrawScoped.scss');

try {
  let css = fs.readFileSync(inputPath, 'utf8');

  // 1. Extract @font-face rules
  const fontFaceRegex = /@font-face\s*{[^}]*}/g;
  const fontFaces = css.match(fontFaceRegex) || [];

  // Remove font-faces from the main CSS to wrap them separately (or keep them at top)
  // Actually, user said keep them at top level.
  let remainingCss = css.replace(fontFaceRegex, '');

  // 2. Sanitize: Remove body, html, and generic button resets
  // This is a bit heuristic with regex, but we'll try to be specific.

  // Remove "body { ... }" or "html { ... }" or "body, html { ... }" blocks
  // Note: CSS might be minified, so whitespace is minimal.
  // We look for selectors starting with body or html, followed by { ... }

  // Simple regex to find blocks. This assumes balanced braces which regex struggles with,
  // but for minified CSS where blocks are usually simple, it might work.
  // However, a safer approach for minified CSS is to replace specific known bad patterns if we can find them.
  // Or, since we know what we want to kill:

  // Remove body/html style blocks
  remainingCss = remainingCss.replace(/(?:^|})(?:html|body|:root|button)(?:,[^,{]+)*\s*{[^}]*}/g, (match) => {
      // Check if it's a dangerous selector
      if (match.includes('font-family') || match.includes('height:100%') || match.includes('height: 100%') || match.includes('margin:0')) {
          console.log('Removing global reset block:', match.substring(0, 50) + '...');
          return '}'; // Keep the closing brace of the previous block if we matched it
      }
      return match;
  });

  // 3. Replace :root with & (for nesting)
  // But wait, we need to wrap it first.

  // 4. Wrap in .excalidraw-wrapper
  const wrappedCss = `.excalidraw-wrapper {
    ${remainingCss}

    /* Fix for z-index contexts */
    isolation: isolate;
  }`;

  // 5. Replace :root inside the wrapper
  // The user said: Map :root to the wrapper.
  // Since we wrapped it, :root inside becomes .excalidraw-wrapper :root which is wrong.
  // We want it to be just & (referencing the wrapper).
  // But wait, if we replace :root with &, it becomes .excalidraw-wrapper.
  // Let's do the replacement on remainingCss BEFORE wrapping?
  // No, if we replace :root with &, and then wrap, it becomes .excalidraw-wrapper { & { ... } } which is .excalidraw-wrapper.excalidraw-wrapper (too specific?) or just .excalidraw-wrapper.
  // Actually, usually :root variables are defined at top level.
  // If we want them scoped, we change :root to .excalidraw-wrapper.

  // Let's replace :root with & inside the wrapper context.
  // Or simply replace :root with .excalidraw-wrapper in the raw CSS, then wrap?
  // If we wrap, we don't need to replace :root with .excalidraw-wrapper, we can replace it with &.

  const finalCss = `
/* ExcalidrawScoped.scss - Auto-generated */

/* 1. Font Faces */
${fontFaces.join('\n')}

/* 2. Scoped Styles */
${wrappedCss.replace(/:root/g, '&')}
`;

  fs.writeFileSync(outputPath, finalCss);
  console.log('Successfully created ExcalidrawScoped.scss');

} catch (error) {
  console.error('Error processing CSS:', error);
  process.exit(1);
}
