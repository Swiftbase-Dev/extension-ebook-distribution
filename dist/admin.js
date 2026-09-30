/**
 * Standalone Web Component for E-book Distribution Admin Page
 * <ext-ebook-distribution>
 */
(function() {
  class ExtEbookDistribution extends HTMLElement {
    constructor() {
      super();
      this.activeTab = "files";
      this.products = [];
      this.selectedProductId = "";
      this.uploadFormat = "epub";
      this.ebookFiles = [];
      this.uploadingFile = false;
      this.freeCopies = [];
      this.sendingFreeCopy = false;
      this.freeCopyForm = { productId: "", recipientName: "", recipientEmail: "", message: "" };
      this.cards = [];
      this.generatingCards = false;
      this.cardForm = { productId: "", count: 10, prefix: "READ" };
    }

    get apiBase() {
      return this._apiBase || "/api/extensions/ebook-distribution";
    }

    set apiBase(val) {
      this._apiBase = val;
    }

    connectedCallback() {
      this.loadInitialData();
    }

    async loadInitialData() {
      try {
        const prodRes = await fetch("/api/products");
        if (prodRes.ok) {
          this.products = await prodRes.json();
          if (this.products.length > 0 && !this.selectedProductId) {
            this.selectedProductId = this.products[0].id;
          }
        }
        await this.loadEbookFiles();
      } catch (err) {
        console.error("Init failed:", err);
      }
      this.render();
    }

    async loadEbookFiles() {
      if (!this.selectedProductId) return;
      try {
        const res = await fetch(`${this.apiBase}/data/files?key=${this.selectedProductId}`);
        if (res.ok) {
          const resData = await res.json();
          let files = [];
          if (Array.isArray(resData)) {
            files = resData.map(r => r.data || r);
          } else if (resData && resData.data) {
            files = Array.isArray(resData.data) ? resData.data : (resData.data.files || [resData.data]);
          } else if (resData) {
            files = Array.isArray(resData.files) ? resData.files : [resData];
          }
          this.ebookFiles = files.filter(Boolean);
        } else {
          this.ebookFiles = [];
        }
      } catch (err) {
        console.error("Load files failed:", err);
        this.ebookFiles = [];
      }
    }


    async loadFreeCopies() {
      try {
        const res = await fetch(`${this.apiBase}/data/free-copies`);
        if (res.ok) {
          const recs = await res.json();
          this.freeCopies = recs.map(r => r.data || r);
        }
      } catch (err) {
        console.error("Load free copies failed:", err);
      }
    }

    async loadCards() {
      try {
        const res = await fetch(`${this.apiBase}/data/cards`);
        if (res.ok) {
          const recs = await res.json();
          this.cards = recs.map(r => r.data || r);
        }
      } catch (err) {
        console.error("Load cards failed:", err);
      }
    }

    render() {
      this.innerHTML = `
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">E-book Distribution & Reader Hub</h2>
              <p class="text-xs text-slate-500 mt-0.5">Manage digital book formats, send review copies, and generate offline handout card codes.</p>
            </div>
          </div>

          <!-- Tabs Header -->
          <div class="tabs tabs-boxed bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
            <button id="tab-files" class="tab tab-sm font-bold text-xs uppercase rounded-xl transition-all ${this.activeTab === 'files' ? 'tab-active !bg-primary !text-white shadow-sm' : ''}">
              📚 Book Formats
            </button>
            <button id="tab-copies" class="tab tab-sm font-bold text-xs uppercase rounded-xl transition-all ${this.activeTab === 'free-copies' ? 'tab-active !bg-primary !text-white shadow-sm' : ''}">
              💌 Send Free Copies
            </button>
            <button id="tab-cards" class="tab tab-sm font-bold text-xs uppercase rounded-xl transition-all ${this.activeTab === 'cards' ? 'tab-active !bg-primary !text-white shadow-sm' : ''}">
              🎟️ Offline Cards
            </button>
          </div>

          <!-- Tab 1: Book Files -->
          ${this.activeTab === 'files' ? `
            <div class="card bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div class="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-base-200 dark:border-slate-800">
                <div class="flex-1 w-full">
                  <label class="text-xs font-bold text-slate-500 mb-1 block">Select Book / Product</label>
                  <select id="select-product" class="select select-bordered select-sm w-full rounded-xl text-xs dark:bg-slate-800">
                    ${this.products.map(p => `
                      <option value="${p.id}" ${this.selectedProductId === p.id ? 'selected' : ''}>${p.name}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="flex items-end gap-2 w-full sm:w-auto">
                  <div>
                    <label class="text-xs font-bold text-slate-500 mb-1 block">Format</label>
                    <select id="select-format" class="select select-bordered select-sm rounded-xl text-xs dark:bg-slate-800">
                      <option value="epub" ${this.uploadFormat === 'epub' ? 'selected' : ''}>EPUB</option>
                      <option value="pdf" ${this.uploadFormat === 'pdf' ? 'selected' : ''}>PDF</option>
                      <option value="mobi" ${this.uploadFormat === 'mobi' ? 'selected' : ''}>MOBI / Kindle</option>
                    </select>
                  </div>

                  <label class="btn btn-sm btn-primary text-white rounded-xl text-xs font-bold px-4 gap-1.5 cursor-pointer shadow-sm">
                    Upload File
                    <input type="file" id="file-input" class="hidden" accept=".epub,.pdf,.mobi,.azw3" />
                  </label>
                </div>
              </div>

              ${this.uploadingFile ? `
                <div class="flex justify-center py-10">
                  <span class="loading loading-spinner loading-md text-primary"></span>
                </div>
              ` : this.ebookFiles.length === 0 ? `
                <div class="text-center py-12 text-slate-400 text-xs border border-dashed border-base-200 dark:border-slate-800 rounded-2xl">
                  No formats uploaded yet for this product. Upload an EPUB, PDF, or MOBI file above.
                </div>
              ` : `
                <div class="space-y-3">
                  <h4 class="text-xs font-black uppercase tracking-wider text-slate-400">Available Formats for this Book</h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${this.ebookFiles.map(file => `
                      <div class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-base-200 dark:border-slate-800">
                        <div class="flex items-center gap-3">
                          <span class="badge badge-primary font-bold uppercase text-[10px]">${file.format}</span>
                          <div>
                            <h5 class="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[200px]">${file.fileName}</h5>
                            <p class="text-[10px] text-slate-400">${this.formatBytes(file.fileSizeBytes)}</p>
                          </div>
                        </div>
                        <button class="btn btn-ghost btn-xs text-rose-500 hover:bg-rose-500/10 rounded-lg btn-del-file" data-id="${file.id}">
                          ✕
                        </button>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `}
            </div>
          ` : ''}

          <!-- Tab 2: Free Copies -->
          ${this.activeTab === 'free-copies' ? `
            <div class="card bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <form id="form-free-copy" class="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-base-200 dark:border-slate-800 space-y-4">
                <h4 class="text-xs font-black uppercase tracking-wider text-slate-500">Send Complimentary Review Copy</h4>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="text-[11px] font-bold text-slate-500 mb-1 block">Recipient Name</label>
                    <input id="input-copy-name" type="text" placeholder="e.g. Jane Doe" class="input input-bordered input-sm w-full rounded-xl text-xs dark:bg-slate-800" required />
                  </div>
                  <div>
                    <label class="text-[11px] font-bold text-slate-500 mb-1 block">Recipient Email</label>
                    <input id="input-copy-email" type="email" placeholder="jane@example.com" class="input input-bordered input-sm w-full rounded-xl text-xs dark:bg-slate-800" required />
                  </div>
                  <div>
                    <label class="text-[11px] font-bold text-slate-500 mb-1 block">Book to Send</label>
                    <select id="select-copy-product" class="select select-bordered select-sm w-full rounded-xl text-xs dark:bg-slate-800" required>
                      <option value="" disabled selected>-- Select book --</option>
                      ${this.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                  </div>
                </div>

                <div>
                  <label class="text-[11px] font-bold text-slate-500 mb-1 block">Personal Message (Optional)</label>
                  <textarea id="input-copy-msg" rows="2" placeholder="Hi Jane, here is your complimentary copy." class="textarea textarea-bordered w-full rounded-xl text-xs dark:bg-slate-800"></textarea>
                </div>

                <div class="flex justify-end">
                  <button type="submit" class="btn btn-sm btn-primary text-white font-bold rounded-xl px-6 text-xs uppercase shadow-md" ${this.sendingFreeCopy ? 'disabled' : ''}>
                    ${this.sendingFreeCopy ? 'Sending...' : 'Send Copy &rarr;'}
                  </button>
                </div>
              </form>

              <!-- Dispatch History -->
              <div class="space-y-3">
                <h4 class="text-xs font-black uppercase tracking-wider text-slate-400">Dispatch History</h4>
                <div class="overflow-x-auto border border-base-200 dark:border-slate-800 rounded-2xl">
                  <table class="table table-xs w-full">
                    <thead>
                      <tr class="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[9px]">
                        <th>Recipient</th>
                        <th>Book</th>
                        <th>Download Link</th>
                        <th>Downloads</th>
                        <th>Date Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.freeCopies.map(c => `
                        <tr class="hover">
                          <td class="font-bold text-xs">${c.recipientName} <span class="opacity-50 text-[10px]">(${c.recipientEmail})</span></td>
                          <td class="text-xs">${c.productTitle}</td>
                          <td>
                            <a href="/download/${c.token}" target="_blank" class="text-primary font-mono text-[10px] hover:underline">/download/${c.token.substring(0, 10)}...</a>
                          </td>
                          <td><span class="badge badge-sm badge-ghost text-[10px]">${c.downloadCount || 0} / ${c.maxDownloads || 5}</span></td>
                          <td class="text-[10px] text-slate-400">${new Date(c.createdAt).toLocaleDateString()}</td>
                        </tr>
                      `).join('')}
                      ${this.freeCopies.length === 0 ? `
                        <tr><td colspan="5" class="text-center py-6 text-slate-400 text-xs">No free copies sent yet.</td></tr>
                      ` : ''}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Tab 3: Offline Cards -->
          ${this.activeTab === 'cards' ? `
            <div class="card bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <form id="form-gen-cards" class="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-base-200 dark:border-slate-800 flex flex-wrap items-end gap-3">
                <div class="flex-1 min-w-[200px]">
                  <label class="text-[11px] font-bold text-slate-500 mb-1 block">Book for Handout Cards</label>
                  <select id="select-card-prod" class="select select-bordered select-sm w-full rounded-xl text-xs dark:bg-slate-800" required>
                    <option value="" disabled selected>-- Select book --</option>
                    ${this.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                  </select>
                </div>
                <div class="w-24">
                  <label class="text-[11px] font-bold text-slate-500 mb-1 block">Count</label>
                  <input id="input-card-count" type="number" min="1" max="50" value="10" class="input input-bordered input-sm w-full rounded-xl text-xs dark:bg-slate-800" required />
                </div>
                <div class="w-28">
                  <label class="text-[11px] font-bold text-slate-500 mb-1 block">Prefix</label>
                  <input id="input-card-prefix" type="text" value="READ" class="input input-bordered input-sm w-full rounded-xl text-xs dark:bg-slate-800 uppercase" />
                </div>
                <button type="submit" class="btn btn-sm btn-primary text-white font-bold rounded-xl px-6 text-xs uppercase shadow-md" ${this.generatingCards ? 'disabled' : ''}>
                  ${this.generatingCards ? 'Generating...' : 'Generate Cards'}
                </button>
              </form>

              <!-- Cards Table -->
              <div class="space-y-3">
                <h4 class="text-xs font-black uppercase tracking-wider text-slate-400">Single-Use Card Codes</h4>
                <div class="overflow-x-auto border border-base-200 dark:border-slate-800 rounded-2xl">
                  <table class="table table-xs w-full">
                    <thead>
                      <tr class="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[9px]">
                        <th>Card Code</th>
                        <th>Book</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.cards.map(card => `
                        <tr class="hover">
                          <td class="font-mono font-bold text-xs text-primary">${card.code}</td>
                          <td class="text-xs">${card.productTitle}</td>
                          <td>
                            ${card.isRedeemed ? `
                              <span class="badge badge-sm badge-error text-white font-bold text-[9px]">Redeemed</span>
                            ` : `
                              <span class="badge badge-sm badge-success text-white font-bold text-[9px]">Available</span>
                            `}
                          </td>
                          <td class="text-[10px] text-slate-400">${new Date(card.createdAt).toLocaleDateString()}</td>
                        </tr>
                      `).join('')}
                      ${this.cards.length === 0 ? `
                        <tr><td colspan="4" class="text-center py-6 text-slate-400 text-xs">No download cards generated yet.</td></tr>
                      ` : ''}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      this.attachEventListeners();
    }

    attachEventListeners() {
      this.querySelector("#tab-files")?.addEventListener("click", async () => {
        this.activeTab = "files";
        await this.loadEbookFiles();
        this.render();
      });

      this.querySelector("#tab-copies")?.addEventListener("click", async () => {
        this.activeTab = "free-copies";
        await this.loadFreeCopies();
        this.render();
      });

      this.querySelector("#tab-cards")?.addEventListener("click", async () => {
        this.activeTab = "cards";
        await this.loadCards();
        this.render();
      });

      this.querySelector("#select-product")?.addEventListener("change", async (e) => {
        this.selectedProductId = e.target.value;
        await this.loadEbookFiles();
        this.render();
      });

      this.querySelector("#select-format")?.addEventListener("change", (e) => {
        this.uploadFormat = e.target.value;
      });

      this.querySelector("#file-input")?.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file || !this.selectedProductId) return;
        this.uploadingFile = true;
        this.render();

        const reader = new FileReader();
        reader.onload = async (evt) => {
          const fileId = `file_${Date.now()}`;
          const newRecord = {
            id: fileId,
            productId: this.selectedProductId,
            format: this.uploadFormat,
            fileName: file.name,
            fileSizeBytes: file.size,
            uploadedAt: new Date().toISOString()
          };
          // Filter out any existing file with the same format and append the new one
          const updatedFiles = (this.ebookFiles || []).filter(f => f.format !== this.uploadFormat);
          updatedFiles.push(newRecord);

          await fetch(`${this.apiBase}/data/files`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: this.selectedProductId, data: updatedFiles })
          });
          this.uploadingFile = false;
          await this.loadEbookFiles();
          this.render();
        };
        reader.readAsDataURL(file);
      });

      this.querySelectorAll(".btn-del-file").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          if (!confirm("Delete this file format?")) return;
          const id = e.currentTarget.dataset.id;
          const updatedFiles = (this.ebookFiles || []).filter(f => f.id !== id);
          if (updatedFiles.length > 0) {
            await fetch(`${this.apiBase}/data/files`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: this.selectedProductId, data: updatedFiles })
            });
          } else {
            await fetch(`${this.apiBase}/data/files?key=${this.selectedProductId}`, { method: "DELETE" });
          }
          await this.loadEbookFiles();
          this.render();
        });
      });

      this.querySelector("#form-free-copy")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const selectedProdId = this.querySelector("#select-copy-product")?.value;
        const recipientName = this.querySelector("#input-copy-name")?.value || "";
        const recipientEmail = this.querySelector("#input-copy-email")?.value || "";
        const message = this.querySelector("#input-copy-msg")?.value || "";

        this.sendingFreeCopy = true;
        this.render();

        const prod = this.products.find(p => p.id === selectedProdId);
        const token = "d_" + Math.random().toString(36).substring(2, 12);
        const record = {
          id: `copy_${Date.now()}`,
          token,
          productId: prod?.id,
          productTitle: prod?.name || "Book",
          recipientName,
          recipientEmail,
          message,
          downloadCount: 0,
          maxDownloads: 5,
          createdAt: new Date().toISOString()
        };
        await fetch(`${this.apiBase}/data/free-copies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: token, data: record })
        });

        // Trigger transactional delivery email via extension email endpoint
        try {
          const downloadUrl = `${window.location.origin}/download/${token}`;
          const bookTitle = prod?.name || "Book";
          const emailSubject = `Your complimentary copy of "${bookTitle}" is ready`;
          const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.6;">
              <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 8px;">Hi ${record.recipientName},</h2>
              <p style="font-size: 14px; color: #475569; margin-top: 0;">You have received a complimentary digital review copy of <strong>${bookTitle}</strong>.</p>
              ${record.message ? `<blockquote style="border-left: 4px solid #0284c7; padding-left: 14px; margin: 20px 0; color: #475569; font-style: italic; background: #f8fafc; padding: 12px 16px; border-radius: 4px;">"${record.message}"</blockquote>` : ''}
              <div style="margin: 28px 0;">
                <a href="${downloadUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
                  Download Your E-book &rarr;
                </a>
              </div>
              <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                Available in EPUB, Kindle, and PDF formats with step-by-step reading instructions for your devices.
              </p>
            </div>
          `;

          const emailRes = await fetch(`${this.apiBase}/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: record.recipientEmail,
              subject: emailSubject,
              htmlBody: emailHtml,
              textBody: `Hi ${record.recipientName},\n\nYou have received a complimentary copy of "${bookTitle}". Download it here: ${downloadUrl}\n\n${record.message || ""}`
            })
          });

          if (!emailRes.ok) {
            const errData = await emailRes.json().catch(() => ({}));
            console.warn("Email dispatch notice:", errData.message || emailRes.statusText);
          }
        } catch (mailErr) {
          console.error("Failed to dispatch recipient email:", mailErr);
        }

        this.sendingFreeCopy = false;
        await this.loadFreeCopies();
        this.render();
      });

      this.querySelector("#form-gen-cards")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const prodId = this.querySelector("#select-card-prod")?.value;
        const count = parseInt(this.querySelector("#input-card-count")?.value, 10) || 5;
        const prefix = (this.querySelector("#input-card-prefix")?.value || "READ").toUpperCase();

        this.generatingCards = true;
        this.render();
        const prod = this.products.find(p => p.id === prodId);

        for (let i = 0; i < count; i++) {
          const code = `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          const token = "c_" + Math.random().toString(36).substring(2, 12);
          const card = {
            id: `card_${Date.now()}_${i}`,
            code,
            token,
            productId: prodId,
            productTitle: prod?.name || "Book",
            isRedeemed: false,
            createdAt: new Date().toISOString()
          };
          await fetch(`${this.apiBase}/data/cards`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: code, data: card })
          });
        }
        this.generatingCards = false;
        await this.loadCards();
        this.render();
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

  if (typeof customElements !== "undefined" && !customElements.get("ext-ebook-distribution")) {
    customElements.define("ext-ebook-distribution", ExtEbookDistribution);
  }
})();
