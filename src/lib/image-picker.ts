type ImagePickerWindow = {
  showOpenFilePicker?: (options: {
    id: string;
    multiple: boolean;
    types: { accept: Record<string, string[]> }[];
  }) => Promise<Pick<FileSystemFileHandle, "getFile">[]>;
};

export async function pickImageFiles(
  browser: Window | ImagePickerWindow,
  openFallback: () => void,
): Promise<File[] | null> {
  // TypeScript's DOM declarations do not include this optional browser API.
  const pickerBrowser = browser as ImagePickerWindow;
  if (!pickerBrowser.showOpenFilePicker) {
    openFallback();
    return null;
  }

  let handles: Pick<FileSystemFileHandle, "getFile">[];
  try {
    handles = await pickerBrowser.showOpenFilePicker({
      // Keep one ID across uploads and galleries so the browser remembers
      // the last image folder, including after a page refresh.
      id: "gallery-images",
      multiple: true,
      types: [
        {
          accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
            "image/avif": [".avif"],
          },
        },
      ],
    });
  } catch (error) {
    const name = (error as Error).name;
    if (name === "AbortError") return null;
    if (name === "SecurityError" || name === "NotAllowedError") {
      openFallback();
      return null;
    }
    throw error;
  }

  return Promise.all(handles.map((handle) => handle.getFile()));
}
