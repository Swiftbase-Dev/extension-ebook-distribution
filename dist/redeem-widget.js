/**
 * Standalone Web Component for Offline E-book Card Redemption Widget
 * <ext-ebook-redeem>
 */
(function() {
  class ExtEbookRedeemWidget extends HTMLElement {
    constructor() {
      super();
      this.redeeming = false;
      this.error = "";
    }

    get apiBase() {
      return this._apiBase || "/api/extensions/ebook-distribution";
    }

    set apiBase(val) {
      this._apiBase = val;
    }

    connectedCallback() {
      this.render();
    }

    render() {
      this.innerHTML = `
        <div style="
          max-width: 28rem;
          margin: 2rem auto;
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          text-align: center;
          font-family: ui-sans-serif, system-ui, sans-serif;
        ">
          <div style="
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 1rem;
            background: rgba(2, 132, 199, 0.1);
            color: #0284c7;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin: 0 auto 1rem auto;
          ">
            🎟️
          </div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 900;">Redeem Download Code</h3>
          <p style="margin: 0 0 1.5rem 0; font-size: 0.8rem; color: #64748b; line-height: 1.5;">
            Enter the code from your handout card or sticker to unlock and download your complimentary e-book edition.
          </p>

          <form id="form-redeem" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <input
              id="input-code"
              type="text"
              placeholder="e.g. READ-A3F8-K92X"
              style="
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e2e8f0;
                border-radius: 0.875rem;
                font-family: monospace;
                font-weight: 700;
                text-align: center;
                font-size: 1rem;
                text-transform: uppercase;
                outline: none;
                box-sizing: border-box;
              "
              required
            />

            ${this.error ? `
              <div style="padding: 0.5rem; border-radius: 0.5rem; background: #fee2e2; color: #b91c1c; font-size: 0.75rem;">
                ${this.error}
              </div>
            ` : ''}

            <button
              type="submit"
              style="
                width: 100%;
                padding: 0.85rem;
                background: #0284c7;
                color: white;
                border: none;
                border-radius: 0.875rem;
                font-weight: 800;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                cursor: pointer;
                box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3);
              "
              ${this.redeeming ? 'disabled' : ''}
            >
              ${this.redeeming ? 'Unlocking...' : 'Unlock E-book &rarr;'}
            </button>
          </form>
        </div>
      `;

      this.querySelector("#form-redeem")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const code = this.querySelector("#input-code")?.value.trim().toUpperCase();
        if (!code) return;

        this.redeeming = true;
        this.error = "";
        this.render();

        try {
          const res = await fetch(`${this.apiBase}/data/cards?key=${encodeURIComponent(code)}`);
          if (!res.ok) throw new Error("Could not verify card code.");
          const recs = await res.json();
          const card = recs && recs[0]?.data;
          if (!card) {
            throw new Error("Invalid or unassigned code. Please check and try again.");
          }
          if (card.isRedeemed) {
            throw new Error("This code has already been redeemed.");
          }

          // Mark redeemed
          card.isRedeemed = true;
          card.redeemedAt = new Date().toISOString();
          await fetch(`${this.apiBase}/data/cards`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: code, data: card })
          });

          // Redirect to customer download route
          window.location.href = `/download/${card.token || code}`;
        } catch (err) {
          this.error = err.message || "Failed to redeem code.";
          this.redeeming = false;
          this.render();
        }
      });
    }
  }

  if (typeof customElements !== "undefined" && !customElements.get("ext-ebook-redeem")) {
    customElements.define("ext-ebook-redeem", ExtEbookRedeemWidget);
  }
})();
