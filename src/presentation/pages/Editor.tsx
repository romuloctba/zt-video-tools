import { Preview, Timeline } from '../components';
import { EditorLayout } from '../layouts/EditorLayout';

/**
 * Editor - Main editor page
 */
export function Editor() {
  return (
    <EditorLayout
      preview={<Preview />}
      timeline={<Timeline />}
    />
  );
}
