import { useEffect, useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import { fetchText, fileKind, parseDelimited } from '../../lib/datafiles';
import { fileSize } from '../../lib/format';
import TableView from './TableView';

const Message = ({ children, file }) => (
  <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
    <p className="font-serif italic text-[17px] text-ink-2 max-w-[36ch]">{children}</p>
    {file && (
      <a
        href={file.url}
        download={file.name}
        className="press inline-flex items-center gap-2 h-9 px-4 rounded-md bg-ink text-canvas text-[13px] hover:bg-ink/85"
      >
        <DownloadSimple size={14} weight="bold" /> Download {fileSize(file.size)}
      </a>
    )}
  </div>
);

// Text-like files (csv, json, code, logs) are fetched and rendered here.
const TextLike = ({ file, kind }) => {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fetchText(file.url, file.size)
      .then(({ text, truncated }) => {
        if (!alive) return;
        if (kind === 'table') setState({ table: parseDelimited(text, { truncated }), truncated });
        else if (kind === 'json') {
          let pretty = text;
          try {
            pretty = JSON.stringify(JSON.parse(text), null, 2);
          } catch {
            /* show as-is (possibly truncated) */
          }
          setState({ text: pretty, truncated });
        } else setState({ text, truncated });
      })
      .catch(() => alive && setState({ error: true }));
    return () => {
      alive = false;
    };
  }, [file.url, file.size, kind]);

  if (state.loading) return <Message>Loading {file.name}</Message>;
  if (state.error) return <Message file={file}>This file could not be loaded for preview.</Message>;

  return (
    <div className="h-full flex flex-col">
      {state.truncated && (
        <p className="px-4 py-2 border-b border-line label shrink-0">Preview shows the first 2 MB. Download for the full file.</p>
      )}
      <div className="flex-1 min-h-0">
        {state.table ? (
          <TableView table={state.table} />
        ) : (
          <pre className="h-full overflow-auto scroll-thin p-4 font-mono text-[12.5px] leading-[1.6] text-ink whitespace-pre">
            {state.text}
          </pre>
        )}
      </div>
    </div>
  );
};

const FilePreview = ({ file }) => {
  const kind = fileKind(file.name, file.mime);

  if (kind === 'table' || kind === 'json' || kind === 'text') return <TextLike key={file.url} file={file} kind={kind} />;
  if (kind === 'image') {
    return (
      <div className="h-full overflow-auto scroll-thin flex items-center justify-center p-4 bg-sunk">
        <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain rounded" />
      </div>
    );
  }
  if (kind === 'video') {
    return (
      <div className="h-full flex items-center justify-center p-4 bg-sunk">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={file.url} controls preload="metadata" className="max-w-full max-h-full rounded" />
      </div>
    );
  }
  if (kind === 'audio') {
    return (
      <div className="h-full flex items-center justify-center p-8">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio src={file.url} controls className="w-full max-w-md" />
      </div>
    );
  }
  if (kind === 'pdf') {
    return <iframe title={file.name} src={file.url} className="w-full h-full border-0 bg-sunk" />;
  }
  return <Message file={file}>No preview for this kind of file yet.</Message>;
};

export default FilePreview;
