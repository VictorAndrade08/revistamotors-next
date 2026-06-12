"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState } from "react";

function Btn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`h-9 min-w-9 rounded-lg px-2.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-[#ed1c24] text-white"
          : "text-gray-700 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  onInsertImage,
  htmlMode,
  onToggleHtml,
}: {
  editor: Editor;
  onInsertImage: () => void;
  htmlMode: boolean;
  onToggleHtml: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
      <Btn title="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <b>B</b>
      </Btn>
      <Btn title="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <i>I</i>
      </Btn>
      <span className="mx-1 h-6 w-px bg-gray-300" />
      <Btn title="Título" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </Btn>
      <Btn title="Subtítulo" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </Btn>
      <span className="mx-1 h-6 w-px bg-gray-300" />
      <Btn title="Lista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • Lista
      </Btn>
      <Btn title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. Lista
      </Btn>
      <Btn title="Cita" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        ❝
      </Btn>
      <span className="mx-1 h-6 w-px bg-gray-300" />
      <Btn
        title="Enlace"
        active={editor.isActive("link")}
        onClick={() => {
          const url = window.prompt("URL del enlace:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
          else editor.chain().focus().unsetLink().run();
        }}
      >
        Enlace
      </Btn>
      <Btn title="Insertar imagen" onClick={onInsertImage}>
        Imagen
      </Btn>
      <span className="ml-auto" />
      <Btn title="Editar como HTML" active={htmlMode} onClick={onToggleHtml}>
        {"</> HTML"}
      </Btn>
    </div>
  );
}

export default function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  // "insert" = añadir nueva imagen ; "replace" = cambiar la imagen clicada
  const mode = useRef<"insert" | "replace">("insert");
  const [htmlMode, setHtmlMode] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Escribe la noticia aquí…" }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  function openInsert() {
    mode.current = "insert";
    fileRef.current?.click();
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.url) return;
    if (mode.current === "replace") {
      editor.chain().focus().updateAttributes("image", { src: data.url }).run();
    } else {
      editor.chain().focus().setImage({ src: data.url }).run();
    }
  }

  // Click sobre una imagen ya puesta -> elegir otra para reemplazarla
  function onContentClick(e: React.MouseEvent) {
    const el = e.target as HTMLElement;
    if (el.tagName === "IMG") {
      mode.current = "replace";
      fileRef.current?.click();
    }
  }

  function toggleHtml() {
    if (htmlMode && editor) {
      // Volver al editor visual aplicando el HTML editado a mano.
      editor.commands.setContent(value || "");
    }
    setHtmlMode((m) => !m);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <Toolbar
        editor={editor}
        onInsertImage={openInsert}
        htmlMode={htmlMode}
        onToggleHtml={toggleHtml}
      />
      {htmlMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="block min-h-[420px] w-full resize-y px-6 py-5 font-mono text-[13px] leading-relaxed text-gray-800 outline-none"
        />
      ) : (
        <div onClick={onContentClick}>
          <EditorContent
            editor={editor}
            className="max-w-none px-6 py-5 text-[17px] leading-relaxed text-gray-800 [&_img]:cursor-pointer [&_img:hover]:opacity-90 [&_img]:transition-opacity"
          />
        </div>
      )}
      <p className="border-t border-gray-100 bg-gray-50 px-6 py-2 text-xs text-gray-400">
        {htmlMode
          ? "Editando el HTML directamente. Pulsa </> HTML para volver al editor visual."
          : "Consejo: haz clic en una imagen para reemplazarla por otra."}
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPick}
      />
    </div>
  );
}
