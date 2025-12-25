import { useEffect, useState, type JSX } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Strikethrough,
  Quote,
  Code2,
  List as ListIcon,
  ListOrdered,
  Link2,
  Link2Off,
  Undo2,
  Redo2,
  Eraser,
  Heading,
  Braces,
} from "lucide-react";

type Props = {
  value: string; // HTML
  onChange: (html: string) => void;
  readOnly?: boolean;
};

export default function RichTextEditor({ value, onChange, readOnly = false }: Props) {
  const [showSource, setShowSource] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value || "<p></p>",
    editable: !readOnly,
    onUpdate({ editor }) {
      if (readOnly) return;
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose max-w-none min-h-[260px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500/30",
      },
    },
  });

  useEffect(() => {
    if (readOnly) setShowSource(false);
  }, [readOnly]);

  // Keep editor in sync when editing an existing post (load -> setContent)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== (value || "<p></p>")) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return <p className="text-sm text-muted-foreground">Loading editor...</p>;

  const button = (icon: JSX.Element, label: string, action: () => void, active = false) => (
    <button
      key={label}
      type="button"
      onClick={action}
      aria-label={label}
      title={label}
      disabled={readOnly}
      className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-cyan-600 text-white shadow-sm"
          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
      } ${readOnly ? "cursor-not-allowed opacity-60" : ""}`}
    >
      {icon}
    </button>
  );

  const addLink = () => {
    const url = prompt("Enter URL");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium ring-1 ring-slate-200">
            <Heading className="h-4 w-4" />
            <select
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
              title="Heading levels"
              disabled={readOnly}
              value={
                editor.isActive("heading", { level: 2 }) ? "2" :
                editor.isActive("heading", { level: 3 }) ? "3" :
                editor.isActive("heading", { level: 4 }) ? "4" :
                editor.isActive("heading", { level: 5 }) ? "5" :
                editor.isActive("heading", { level: 6 }) ? "6" : "p"
              }
              onChange={(e) => {
                const level = e.target.value;
                const chain = editor.chain().focus();
                if (level === "p") chain.setParagraph().run();
                else chain.toggleHeading({ level: Number(level) as 2 | 3 | 4 | 5 | 6 }).run();
              }}
            >
              <option value="p">Paragraph</option>
              <option value="2">Heading 2</option>
              <option value="3">Heading 3</option>
              <option value="4">Heading 4</option>
              <option value="5">Heading 5</option>
              <option value="6">Heading 6</option>
            </select>
          </div>
        </div>
        {button(<BoldIcon className="h-4 w-4" />, "Bold", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
        {button(<ItalicIcon className="h-4 w-4" />, "Italic", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
        {button(<Strikethrough className="h-4 w-4" />, "Strike", () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"))}
        {button(<Quote className="h-4 w-4" />, "Quote", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
        {button(<Code2 className="h-4 w-4" />, "Code block", () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"))}
        {button(<ListIcon className="h-4 w-4" />, "Bulleted list", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
        {button(<ListOrdered className="h-4 w-4" />, "Numbered list", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
        {button(<Link2 className="h-4 w-4" />, "Add link", addLink, editor.isActive("link"))}
        {button(<Link2Off className="h-4 w-4" />, "Remove link", () => editor.chain().focus().unsetLink().run())}
        {button(<Eraser className="h-4 w-4" />, "Clear formatting", () => editor.chain().focus().clearNodes().unsetAllMarks().run())}
        {button(<Braces className="h-4 w-4" />, "HTML source", () => setShowSource((v) => !v), showSource)}
        {button(<Undo2 className="h-4 w-4" />, "Undo", () => editor.chain().focus().undo().run())}
        {button(<Redo2 className="h-4 w-4" />, "Redo", () => editor.chain().focus().redo().run())}
      </div>

      <div className="p-4 space-y-3">
        {showSource ? (
          <textarea
            className="min-h-[260px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            value={value}
            onChange={(e) => {
              if (readOnly) return;
              onChange(e.target.value);
              editor?.commands.setContent(e.target.value || "<p></p>", { emitUpdate: false });
            }}
            readOnly={readOnly}
          />
        ) : (
          <EditorContent editor={editor} />
        )}
        <p className="text-xs text-muted-foreground">
          {readOnly
            ? "Viewing content only. You can edit posts you authored."
            : "Use headings, lists, quotes, code, and links. Toggle the braces icon to edit raw HTML."}
        </p>
      </div>
    </div>
  );
}
