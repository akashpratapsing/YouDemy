import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  CheckCircle2,
  Cloud,
  CloudUpload,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNote, useSaveNote } from '@/hooks/useApi';
import { cn, formatDateTime } from '@/lib/utils';

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 800;

export function NotesEditor({ videoId }: { videoId: string }) {
  const { data: note, isLoading } = useNote(videoId);
  const { mutateAsync: saveNote } = useSaveNote();
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const versionRef = useRef<number>(0);
  const appliedVersionRef = useRef<number>(-1);
  const latestContentRef = useRef<string>('');
  const dirtyRef = useRef(false);
  const sequenceRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const scheduleRef = useRef<() => void>(() => {});

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Write your notes for this video…' }),
    ],
    content: '',
    editorProps: { attributes: { 'aria-label': 'Video notes editor' } },
    onUpdate: ({ editor: instance }) => {
      latestContentRef.current = instance.getHTML();
      dirtyRef.current = true;
      setStatus('unsaved');
      scheduleRef.current();
    },
  });

  const flushSave = useCallback(async () => {
    if (!dirtyRef.current || !editor) return;
    const content = latestContentRef.current;
    const version = versionRef.current;
    const sequence = ++sequenceRef.current;
    dirtyRef.current = false;
    setStatus('saving');
    try {
      const saved = await saveNote({ videoId, content, version });
      if (sequence !== sequenceRef.current) return;
      versionRef.current = saved.version;
      appliedVersionRef.current = saved.version;
      setLastSaved(new Date());
      setStatus('saved');
    } catch {
      if (sequence !== sequenceRef.current) return;
      dirtyRef.current = true;
      setStatus('error');
    }
  }, [editor, saveNote, videoId]);

  useEffect(() => {
    flushRef.current = flushSave;
  }, [flushSave]);

  useEffect(() => {
    scheduleRef.current = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flushRef.current();
      }, DEBOUNCE_MS);
    };
  }, []);

  useEffect(() => {
    if (!editor || !note || note.version === appliedVersionRef.current) return;
    if (dirtyRef.current) return;
    editor.commands.setContent(note.content || '', false);
    latestContentRef.current = note.content || '';
    appliedVersionRef.current = note.version;
    versionRef.current = note.version;
    setStatus('idle');
  }, [editor, note]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dirtyRef.current) void flushRef.current();
    };
  }, [videoId]);

  const addLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const href = window.prompt('Link URL', previous ?? 'https://');
    if (href === null) return;
    if (href.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const statusMeta: Record<SaveStatus, { label: string; icon: typeof Cloud; className: string }> = {
    idle: { label: 'Notes ready', icon: Cloud, className: 'text-muted-foreground' },
    unsaved: { label: 'Unsaved changes', icon: Cloud, className: 'text-amber-600' },
    saving: { label: 'Saving…', icon: Loader2, className: 'text-primary' },
    saved: { label: 'Saved', icon: CheckCircle2, className: 'text-emerald-600' },
    error: { label: 'Save failed — retrying on next edit', icon: CloudUpload, className: 'text-destructive' },
  };
  const meta = statusMeta[status];
  const StatusIcon = meta.icon;

  const tool = (active: boolean) => cn('h-8 w-8', active && 'bg-accent text-accent-foreground');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 p-1.5">
        <Button type="button" variant="ghost" size="icon" className={tool(Boolean(editor?.isActive('bold')))} onClick={() => editor?.chain().focus().toggleBold().run()} aria-label="Bold" title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tool(Boolean(editor?.isActive('italic')))} onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label="Italic" title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tool(Boolean(editor?.isActive('underline')))} onClick={() => editor?.chain().focus().toggleUnderline().run()} aria-label="Underline" title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button type="button" variant="ghost" size="icon" className={tool(Boolean(editor?.isActive('heading', { level: 2 })))} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading" title="Heading">
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tool(Boolean(editor?.isActive('bulletList')))} onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-label="Bullet list" title="Bullet list">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tool(Boolean(editor?.isActive('orderedList')))} onClick={() => editor?.chain().focus().toggleOrderedList().run()} aria-label="Numbered list" title="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={tool(Boolean(editor?.isActive('link')))} onClick={addLink} aria-label="Insert link" title="Insert link">
          <Link2 className="h-4 w-4" />
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor?.chain().focus().undo().run()} aria-label="Undo" title="Undo" disabled={!editor?.can().undo()}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor?.chain().focus().redo().run()} aria-label="Redo" title="Redo" disabled={!editor?.can().redo()}>
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring/30">
        <EditorContent editor={editor} className="tiptap-wrapper" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className={cn('inline-flex items-center gap-1.5', meta.className)} data-testid="notes-status">
          <StatusIcon className={cn('h-3.5 w-3.5', status === 'saving' && 'animate-spin')} />
          {meta.label}
        </span>
        <span>Last saved {lastSaved ? formatDateTime(lastSaved.toISOString()) : '—'}</span>
      </div>
    </div>
  );
}
