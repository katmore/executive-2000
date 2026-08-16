export interface LegacyPage {
  url: string;
  /** Visual era, per the design note that different internal systems should look period-inconsistent. */
  era: "bare-1998" | "asp-error-2002";
  /** Authored, trusted HTML fragment for the page body — not derived from any user input. */
  bodyHtml: string;
}

export const LEGACY_PAGES: Record<string, LegacyPage> = {
  "refund-policy-current": {
    url: "https://intranet.acme.local/cx/refund-policy",
    era: "asp-error-2002",
    bodyHtml: `
      <div class="legacy-topbar">ACME INTRANET &mdash; POLICY LIBRARY</div>
      <div class="legacy-content-inner">
        <p class="legacy-muted">[ ASP CLASSIC &mdash; LEGACY SYSTEM ]</p>
        <h1>Refund Exception Policy</h1>
        <p><em>Revision 2019-03</em></p>
        <p>Exceptions above $<span class="legacy-blank">&nbsp;</span> require Regional Director approval.</p>
        <div class="legacy-error-box">
          <div class="legacy-error-title">Windows Script Host</div>
          <div class="legacy-error-body">
            <p>Microsoft VBScript runtime error '800a000d'</p>
            <p>Type mismatch: 'GetRefundThreshold'</p>
            <p>/cx/policy.asp, line 84</p>
          </div>
        </div>
      </div>
    `,
  },

  "refund-policy-archive": {
    url: "https://intranet.acme.local/archive/cx/refund-policy-2019.html",
    era: "bare-1998",
    bodyHtml: `
      <div class="legacy-content-inner legacy-1998">
        <h1>ACME Corp. Intranet</h1>
        <hr />
        <h2>Refund Exception Policy &mdash; Archived Copy</h2>
        <p>This is a cached copy retained by the archive crawler. Last indexed 2019-04-02.</p>
        <p>Exceptions above <b>$250</b> require Regional Director approval.</p>
        <p>Exceptions above $1,000 require Vice President approval.</p>
        <hr />
        <p><a href="#">Return to Policy Library</a></p>
      </div>
    `,
  },
};
