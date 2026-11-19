import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotesEditor } from '@/components/notes/NotesEditor';
import { api } from '@/lib/api';
import { envelope, renderApp } from '@/test/utils';

const note = {
  content: '',
  version: 0,
  updatedAt: null,
};

function mockNoteApi(options: { failSave?: boolean } = {}) {
  vi.spyOn(api, 'get').mockResolvedValue({ data: envelope(note) } as never);
  const put = vi.spyOn(api, 'put');
  if (options.failSave) {
    put.mockRejectedValue(new Error('Server unavailable'));
  } else {
    put.mockResolvedValue({
      data: envelope({ content: '<p>Hello from my notes</p>', version: 1, updatedAt: '2026-11-18T10:00:00.000Z' }),
    } as never);
  }
  return put;
}

describe('notes editor', () => {
  it('autosaves edited content with the current version and reports success', async () => {
    const put = mockNoteApi();
    const { container } = renderApp(<NotesEditor videoId="video-1" />);
    const userEventSetup = userEvent.setup();

    expect(await screen.findByText('Notes ready')).toBeInTheDocument();
    const editor = container.querySelector('.ProseMirror') as HTMLElement;
    expect(editor).toBeInTheDocument();
    await userEventSetup.click(editor);
    await userEventSetup.keyboard('Hello from my notes');

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    await waitFor(() => {
      expect(put).toHaveBeenCalledWith('/videos/video-1/notes', {
        content: expect.stringContaining('Hello from my notes'),
        version: 0,
      });
    }, { timeout: 3000 });
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('surfaces a save failure and keeps the content dirty for a retry', async () => {
    mockNoteApi({ failSave: true });
    const { container } = renderApp(<NotesEditor videoId="video-2" />);
    const userEventSetup = userEvent.setup();

    expect(await screen.findByText('Notes ready')).toBeInTheDocument();
    await userEventSetup.click(container.querySelector('.ProseMirror') as HTMLElement);
    await userEventSetup.keyboard('Retry me');

    expect(await screen.findByText('Save failed — retrying on next edit', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
