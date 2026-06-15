import { Node } from '@tiptap/core';

// Minimal block node for uploaded <video> files so they round-trip through
// the editor and serialize to clean HTML.
const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'video[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', { controls: 'true', preload: 'metadata', ...HTMLAttributes }];
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});

export default Video;
