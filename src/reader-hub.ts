/**
 * Customer-Facing E-book Reader Download Hub Client
 * Interactive format selector, download counter, and device guide renderer.
 */

export interface DownloadData {
  distribution: {
    token: string;
    downloadCount: number;
    maxDownloads: number;
  };
  product: {
    id: string;
    name: string;
    description: string;
    images?: string[];
  };
  files: Array<{
    id: string;
    format: string;
    fileName: string;
    fileSizeBytes: number;
  }>;
}

export function renderReaderHub(container: HTMLElement, data: DownloadData) {
  const remaining = Math.max(0, data.distribution.maxDownloads - data.distribution.downloadCount);
  
  container.innerHTML = `
    <div class="ebook-reader-hub-card" style="max-width: 54rem; margin: 0 auto; background: #0f172a; color: #f8fafc; border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
      <div style="display: flex; gap: 2rem; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2rem;">
        <div style="width: 8rem; height: 12rem; border-radius: 1rem; overflow: hidden; background: #1e293b; box-shadow: 0 10px 15px rgba(0,0,0,0.3); flex-shrink: 0;">
          ${data.product.images?.[0] ? `<img src="${data.product.images[0]}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<div style="height: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #64748b;">No Cover</div>`}
        </div>
        <div style="flex: 1;">
          <span style="background: rgba(2, 132, 199, 0.2); color: #38bdf8; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 0.25rem 0.75rem; border-radius: 0.5rem;">Digital Edition</span>
          <h1 style="font-size: 2rem; font-weight: 900; margin: 0.5rem 0 0.25rem 0; letter-spacing: -0.02em;">${data.product.name}</h1>
          <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.6;">${data.product.description || ''}</p>
          <div style="margin-top: 1rem; font-size: 0.75rem; color: #64748b;">
            Downloads remaining: <strong style="color: #38bdf8;">${remaining}</strong> of ${data.distribution.maxDownloads}
          </div>
        </div>
      </div>

      <!-- Download Formats Grid -->
      <div style="margin-top: 2rem;">
        <h3 style="font-size: 0.85rem; text-transform: uppercase; font-weight: 900; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 1rem;">Choose Your Format</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
          ${data.files.map(f => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 900; font-size: 1.1rem; text-transform: uppercase;">${f.format}</span>
                  <span style="font-size: 0.7rem; color: #64748b; font-family: monospace;">${(f.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem;">
                  ${f.format.toLowerCase() === 'epub' ? 'For Apple Books, Kobo, Android, & Nook' : (f.format.toLowerCase() === 'mobi' ? 'For Kindle eReaders & Paperwhite' : 'For Desktop & PDF readers')}
                </div>
              </div>
              <a href="/api/ebooks/download/${data.distribution.token}/file/${f.id}" style="margin-top: 1.25rem; display: block; text-align: center; background: #0284c7; color: white; text-decoration: none; padding: 0.75rem; border-radius: 0.75rem; font-weight: 800; font-size: 0.8rem; text-transform: uppercase;">
                Download ${f.format.toUpperCase()}
              </a>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
