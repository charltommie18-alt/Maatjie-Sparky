// A download is only initiated, not confirmed. All image data stays in this page.
export function downloadDrawing(canvas, createLink, urls, schedule, report) {
  const failure = () => report('Kon nie die prent aflaai nie.');
  try {
    canvas.toBlob(blob => {
      if (!blob) { failure(); return; }
      let url;
      try {
        url = urls.createObjectURL(blob);
        const link = createLink();
        link.href = url;
        link.download = 'slim-maat-tekening.png';
        link.click();
        schedule(() => urls.revokeObjectURL(url), 10000);
        report('Aflaai van die prent is begin.');
      } catch {
        if (url) { try { urls.revokeObjectURL(url); } catch {} }
        failure();
      }
    }, 'image/png');
  } catch { failure(); }
}
