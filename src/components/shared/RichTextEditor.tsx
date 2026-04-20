import { Editor } from '@tinymce/tinymce-react';

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isVietnamese: boolean;
};

export default function RichTextEditor({
  label,
  value,
  onChange,
  isVietnamese: _isVietnamese,
}: RichTextEditorProps) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">{label}</span>
      <div className="overflow-hidden rounded-2xl border border-on-surface/10 bg-white">
        <Editor
          tinymceScriptSrc="/node_modules/tinymce/tinymce.min.js"
          licenseKey="gpl"
          value={value}
          onEditorChange={onChange}
          init={{
            height: 320,
            menubar: false,
            branding: false,
            promotion: false,
            statusbar: false,
            plugins: 'lists link table code autoresize',
            toolbar:
              'undo redo | blocks | bold italic underline | forecolor | alignleft aligncenter alignright | bullist numlist | link table | removeformat code',
            autoresize_bottom_margin: 16,
            content_style:
              "body { font-family: Inter, sans-serif; font-size: 14px; line-height: 1.6; padding: 12px; }",
          }}
        />
      </div>
    </label>
  );
}
