'use client';

import { useRef, type ReactNode } from 'react';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon, Pilcrow } from 'lucide-react';

type Command = 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList' | 'formatBlock' | 'createLink';

export function RichTextEditor({ name, defaultValue }: { name: string; defaultValue: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);

  function syncValue() {
    if (editorRef.current && valueRef.current) valueRef.current.value = editorRef.current.innerHTML;
  }

  function run(command: Command, value?: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    if (command === 'createLink') {
      const raw = window.prompt('Pega el enlace HTTPS que quieres insertar:');
      if (!raw) return;
      try {
        const url = new URL(raw.trim());
        if (url.protocol !== 'https:') {
          window.alert('Por seguridad, los enlaces deben comenzar con https://');
          return;
        }
        document.execCommand(command, false, url.toString());
      } catch {
        window.alert('Escribe una URL válida que comience con https://');
        return;
      }
    } else {
      document.execCommand(command, false, value);
    }
    syncValue();
  }

  function toolbarButton(label: string, icon: ReactNode, command: Command, value?: string) {
    return (
      <button
        key={label}
        type="button"
        className="rich-toolbar-button"
        title={label}
        aria-label={label}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => run(command, value)}
      >
        {icon}
      </button>
    );
  }

  return (
    <div className="rich-editor">
      <div className="rich-toolbar" role="toolbar" aria-label="Formato del contenido">
        {toolbarButton('Negrita', <Bold size={17} />, 'bold')}
        {toolbarButton('Cursiva', <Italic size={17} />, 'italic')}
        {toolbarButton('Encabezado 2', <Heading2 size={17} />, 'formatBlock', '<h2>')}
        {toolbarButton('Encabezado 3', <Heading3 size={17} />, 'formatBlock', '<h3>')}
        {toolbarButton('Párrafo', <Pilcrow size={17} />, 'formatBlock', '<p>')}
        {toolbarButton('Lista con viñetas', <List size={17} />, 'insertUnorderedList')}
        {toolbarButton('Lista numerada', <ListOrdered size={17} />, 'insertOrderedList')}
        {toolbarButton('Cita', <Quote size={17} />, 'formatBlock', '<blockquote>')}
        {toolbarButton('Insertar enlace', <LinkIcon size={17} />, 'createLink')}
      </div>
      <div
        ref={editorRef}
        className="rich-editor-content"
        id="body-editor"
        contentEditable
        role="textbox"
        aria-label="Contenido de la noticia"
        aria-multiline="true"
        spellCheck
        suppressContentEditableWarning
        data-placeholder="Escribe aquí la noticia. Usa la barra para dar formato al texto."
        dangerouslySetInnerHTML={{ __html: defaultValue }}
        onInput={syncValue}
        onBlur={syncValue}
      />
      <input ref={valueRef} type="hidden" name={name} defaultValue={defaultValue} />
      <p className="small-note">Puedes dar formato con la barra. Por seguridad no se permiten scripts, iframes ni imágenes incrustadas; sube la portada desde Biblioteca multimedia.</p>
    </div>
  );
}
