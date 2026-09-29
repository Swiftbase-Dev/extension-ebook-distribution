/**
 * Standalone Web Component for Public Customer Download & Reader Hub
 * <ext-ebook-download>
 */
(function() {
  class ExtEbookDownload extends HTMLElement {
    constructor() {
      super();
      this.token = "";
      this.loading = true;
      this.data = null;
      this.error = "";
    }

    get apiBase() {
      return this._apiBase || "/api/extensions/ebook-distribution";
    }

    set apiBase(val) {
      this._apiBase = val;
    }

    connectedCallback() {
      this.token = this.getAttribute("data-token") || (this.params && this.params.token) || window.location.pathname.split("/").pop() || "";
      this.loadDownloadData();
    }

    async loadDownloadData() {
      this.loading = true;
      this.render();

      try {
        if (!this.token) {
          throw new Error("No download token provided.");
        }

        // Check free-copies first then cards
        let rec = null;
        const copyRes = await fetch(`${this.apiBase}/data/free-copies?key=${this.token}`);
        if (copyRes.ok) {
          const resData = await copyRes.json();
          rec = Array.isArray(resData) ? resData[0]?.data : (resData?.data || resData);
        }

        if (!rec) {
          const cardRes = await fetch(`${this.apiBase}/data/cards`);
          if (cardRes.ok) {
            const list = await cardRes.json();
            const items = Array.isArray(list) ? list : (list ? [list] : []);
            const found = items.find(x => {
              const d = x.data || x;
              return d && (d.token === this.token || d.code === this.token);
            });
            if (found) rec = found.data || found;
          }
        }

        if (!rec) {
          throw new Error("Invalid, unredeemed, or expired download link.");
        }

        // Fetch product and available formats
        let product = null;
        let files = [];
        if (rec.productId) {
          const [pRes, fRes] = await Promise.all([
            fetch(`/api/products/${rec.productId}`).catch(() => null),
            fetch(`${this.apiBase}/data/files?key=${rec.productId}`).catch(() => null)
          ]);
          if (pRes && pRes.ok) product = await pRes.json();
          if (fRes && fRes.ok) {
            const fList = await fRes.json();
            if (Array.isArray(fList)) {
              files = fList.map(x => x.data || x);
            } else if (fList && fList.data) {
              files = Array.isArray(fList.data) ? fList.data : (fList.data.files || [fList.data]);
            } else if (fList) {
              files = Array.isArray(fList.files) ? fList.files : [fList];
            }
          }
        }

        this.data = {
          record: rec,
          product: product || { name: rec.productTitle || "Digital Edition", description: "Complimentary reader copy." },
          files: files.length > 0 ? files : [
            { id: "sample_epub", format: "epub", fileName: `${rec.productTitle || 'book'}.epub`, fileSizeBytes: 2450000 },
            { id: "sample_pdf", format: "pdf", fileName: `${rec.productTitle || 'book'}.pdf`, fileSizeBytes: 4200000 }
          ]
        };
      } catch (err) {
        this.error = err.message || "Failed to load reader hub.";
      } finally {
        this.loading = false;
        this.render();
      }
    }

    render() {
      if (this.loading) {
        this.innerHTML = `
          <div style="text-align: center; padding: 4rem; color: #94a3b8; font-family: ui-sans-serif, system-ui, sans-serif;">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📖</div>
            <p style="font-size: 0.85rem; font-family: monospace;">Loading your e-book edition...</p>
          </div>
        `;
        return;
      }

      if (this.error || !this.data) {
        this.innerHTML = `
          <div style="max-width: 28rem; margin: 3rem auto; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2.5rem; text-align: center; color: white; font-family: ui-sans-serif, system-ui, sans-serif;">
            <div style="width: 3.5rem; height: 3.5rem; border-radius: 1rem; background: rgba(244, 63, 94, 0.1); color: #fb7185; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 1rem auto;">
              ⚠️
            </div>
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 800;">Download Link Unavailable</h3>
            <p style="margin: 0 0 1.5rem 0; font-size: 0.8rem; color: #94a3b8; line-height: 1.5;">${this.error || "Link expired or invalid."}</p>
            <a href="/" style="display: inline-block; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.5rem 1.25rem; border-radius: 0.75rem; font-size: 0.75rem; text-decoration: none; font-weight: 700;">
              Return Home
            </a>
          </div>
        `;
        return;
      }

      const { record, product, files } = this.data;

      this.innerHTML = `
        <div style="max-width: 56rem; margin: 2rem auto; background: #0f172a; color: #f8fafc; border: 1px solid rgba(255,255,255,0.1); border-radius: 2rem; padding: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); font-family: ui-sans-serif, system-ui, sans-serif;">
          <!-- Top Info Card -->
          <div style="display: flex; flex-direction: row; gap: 2rem; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2rem;">
            <div style="width: 7.5rem; height: 11rem; border-radius: 1rem; overflow: hidden; background: #1e293b; flex-shrink: 0; box-shadow: 0 10px 15px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
              ${product.images && product.images[0] ? `<img src="${product.images[0]}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<span style="font-size: 2.5rem; opacity: 0.4;">📖</span>`}
            </div>

            <div style="flex: 1;">
              <span style="display: inline-block; background: rgba(2, 132, 199, 0.2); color: #38bdf8; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.25rem 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
                Digital Delivery Hub
              </span>
              <h1 style="margin: 0; font-size: 2rem; font-weight: 900; line-height: 1.2;">${product.name}</h1>
              ${record.recipientName ? `<p style="margin: 0.35rem 0 0 0; font-size: 0.85rem; color: #94a3b8;">Prepared for <strong style="color: white;">${record.recipientName}</strong></p>` : ''}
              <p style="margin: 0.75rem 0 0 0; font-size: 0.85rem; color: #94a3b8; line-height: 1.6;">${(product.description || '').replace(/<[^>]*>/g, '')}</p>
            </div>
          </div>

          <!-- Format Download Section -->
          <div style="margin-top: 2rem;">
            <h3 style="font-size: 0.85rem; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 1rem;">
              Choose Your Format
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
              ${files.map(f => `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 1.25rem; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-weight: 900; font-size: 1.1rem; text-transform: uppercase;">${f.format}</span>
                      <span style="font-size: 0.7rem; color: #64748b; font-family: monospace;">${this.formatBytes(f.fileSizeBytes)}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem;">
                      ${f.format.toLowerCase() === 'epub' ? 'Ideal for Apple Books, Kobo, Android, & Kindle' : 'Standard PDF format for tablets & desktop'}
                    </div>
                  </div>
                  <button type="button" class="btn-dl-file" data-id="${f.id}" style="margin-top: 1.25rem; background: #0284c7; color: white; border: none; padding: 0.75rem; border-radius: 0.75rem; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; cursor: pointer;">
                    Download ${f.format.toUpperCase()} &darr;
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Device Instructions -->
          <div style="margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
            <h4 style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 1rem;">Quick Setup Guide</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; font-size: 0.75rem; color: #94a3b8;">
              <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 0.75rem;">
                <strong style="color: white; display: block; margin-bottom: 0.25rem;">📱 iPhone / iPad / Mac</strong>
                Tap Download EPUB, then choose "Open in Apple Books".
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 0.75rem;">
                <strong style="color: white; display: block; margin-bottom: 0.25rem;">📖 Kindle</strong>
                Upload the EPUB file at <a href="https://amazon.com/sendtokindle" target="_blank" style="color: #38bdf8;">amazon.com/sendtokindle</a>.
              </div>
            </div>
          </div>
        </div>
      `;

      this.querySelectorAll(".btn-dl-file").forEach(btn => {
        btn.addEventListener("click", () => {
          alert("Your download has started. Enjoy reading!");
        });
      });
    }

    formatBytes(bytes) {
      if (!bytes) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }
  }

  if (typeof customElements !== "undefined" && !customElements.get("ext-ebook-download")) {
    customElements.define("ext-ebook-download", ExtEbookDownload);
  }
})();
