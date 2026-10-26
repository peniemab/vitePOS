/** Terms of use and privacy policy (English), same structure as `legal.fr.ts`. The French version prevails. */
import type { LegalDoc } from "./legal.fr";

export const terms: LegalDoc = {
  title: "Terms of use",
  description: "The vitePOS terms of use: the service, accounts, trial and subscriptions, your data and your obligations.",
  intro:
    "These terms apply to anyone who creates a vitePOS account or uses the app at {app}. By creating an account, you accept them. In case of difference, the French version prevails.",
  sections: [
    { title: "1. Who publishes vitePOS", paras: ["vitePOS is published by {editor}, {address}. RCCM: {rccm}. Contact: {email} · WhatsApp {whatsapp}."] },
    {
      title: "2. The service",
      paras: [
        "vitePOS is a till and management tool for businesses: sales, receipts, stock, stocktaking, customers, expenses, till days and reports. It runs in a browser and can be installed on the home screen.",
        "It also works without network: entries are kept on the device, then sent online when the connection returns. Creating an account, joining a shop and managing the team require internet.",
      ],
    },
    {
      title: "3. Your account",
      paras: [
        "Each person has their own account, with their e-mail or Google account. Keep your password secret and do not lend your account: a sale made with your account is recorded under your name.",
        "A shop owner invites employees with a code, approves their request and chooses their role. The owner is responsible for how their team uses vitePOS.",
      ],
    },
    {
      title: "4. Trial, plans and payment",
      paras: [
        "Each new shop gets a <b>30-day trial</b> with every feature of the chosen plan. A free version with limited features may also be offered.",
        "After the trial, the shop continues with a paid subscription (Boutique, Pro or Supermarché plan), paid monthly or yearly. Prices are given on request and confirmed before any payment.",
        "Without payment on the due date, the shop has <b>7 days of grace</b>, then switches to <b>read-only</b>: you can view and export your data, but you can no longer record sales. Nothing is deleted; everything is available again as soon as payment is made.",
      ],
    },
    {
      title: "5. Your commitments",
      paras: ["Use vitePOS for a lawful activity, enter accurate information (prices, daily rate, stock), and do not try to access another shop's data or disrupt the service."],
    },
    {
      title: "6. Taxes and invoicing",
      paras: [
        "The vitePOS receipt is a <b>sales receipt</b>. It is not a standardised invoice (« facture normalisée ») within the meaning of the Direction générale des impôts (DGI): vitePOS is not a certified electronic fiscal device.",
        "You remain responsible for your tax obligations, including VAT and, if your business is subject to it, issuing standardised invoices with a DGI-approved device.",
      ],
    },
    {
      title: "7. Your data",
      paras: [
        "The data entered in your shop (products, sales, customers, expenses…) <b>belongs to you</b>. You can export it (for example the catalogue as a CSV file) and ask for its deletion.",
        "How we handle data is described in the <a href=\"/en/privacy\">privacy policy</a>.",
      ],
    },
    {
      title: "8. Availability",
      paras: [
        "We do our best to keep vitePOS available and backed up, but cannot guarantee it will never be interrupted. Entries made offline stay on the device until they are sent: do not log out or clear browser data before they are sent.",
      ],
    },
    {
      title: "9. Liability",
      paras: [
        "vitePOS calculates from what you enter. We are not liable for data-entry errors, a wrongly set daily rate, or losses due to a device that is lost, stolen or wiped before its data was sent. Our liability is limited to the amount paid for the last twelve months of subscription.",
      ],
    },
    {
      title: "10. Ending the subscription",
      paras: ["You can stop at any time by not renewing the subscription. We may suspend an account that breaches these terms, after warning you except in an emergency."],
    },
    { title: "11. Changes", paras: ["We may change these terms. Important changes are announced in the app or by message at least 15 days in advance."] },
    {
      title: "12. Governing law",
      paras: ["These terms are governed by the law of the Democratic Republic of the Congo. In case of disagreement, we first seek an amicable solution; failing that, the courts of Kinshasa have jurisdiction."],
    },
  ],
};

export const privacy: LegalDoc = {
  title: "Privacy policy",
  description: "What data vitePOS keeps, why, where it is hosted, who can see it and how to exercise your rights.",
  intro:
    "This policy explains what data vitePOS keeps, why, where it is hosted and what your rights are, in line with Congolese law, in particular the Digital Code (Ordonnance-loi no. 23/010 of 13 March 2023). In case of difference, the French version prevails.",
  sections: [
    {
      title: "1. Who is responsible",
      paras: [
        "For accounts and subscriptions: {editor}, {address}, reachable at {email} or on WhatsApp at {whatsapp}.",
        "For the data a shop records about its own customers (name, phone, purchases), the <b>shop</b> is responsible; vitePOS hosts and processes it on the shop's behalf.",
      ],
    },
    {
      title: "2. The data we keep",
      paras: [
        "<b>Your account</b>: name, e-mail address, and your Google sign-in if you use it. Passwords are handled by Firebase Authentication (Google): we never see them.",
        "<b>Your shop</b>: name, currency, daily rate, plan and subscription dates, team members and their roles.",
        "<b>Your activity</b>: products, prices, stock, batches and expiry dates, device serial numbers or IMEIs, sales and receipts, expenses, till days, stocktakes, and customers (name, phone, notes, purchases).",
        "<b>On your device</b>: a copy of this data to work without network, and a few preferences (appearance, current cart).",
      ],
    },
    { title: "3. Why", paras: ["Only to run the service: record sales and stock, sync devices, show reports, manage the team and subscription, and help you when you contact us."] },
    { title: "4. What we do not do", paras: ["No advertising, no selling or renting of your data, no tracking. The website {site} uses no cookies and no analytics."] },
    {
      title: "5. Where the data is",
      paras: [
        "vitePOS relies on <b>Google Firebase</b>: Firebase Authentication for accounts, Cloud Firestore for data (hosted in the <b>europe-west1 region, in Belgium</b>) and Firebase Hosting for the app and website. Data therefore travels outside the DRC, to this provider, which is contractually committed to protecting it.",
      ],
    },
    {
      title: "6. Who can see it",
      paras: [
        "The members of your shop, according to their role: for example, a seller sees neither purchase prices nor margins. Each shop is kept apart from the others by access rules checked by the server.",
        "The vitePOS team only accesses it for support, maintenance or a legal obligation.",
      ],
    },
    {
      title: "7. Security",
      paras: ["Exchanges are encrypted (HTTPS), each person has their own account, and every access is checked by shop and by role. A sale cannot be erased, only cancelled, and every stock movement is tracked."],
    },
    {
      title: "8. How long",
      paras: ["As long as your account and shop exist. After a subscription ends, data stays available read-only for 12 months, then is deleted, unless you ask for earlier deletion."],
    },
    {
      title: "9. Your rights",
      paras: [
        "You can ask to access, correct, export or delete your data by writing to {email} or on WhatsApp at {whatsapp}. We reply within 30 days.",
        "If the shop records customers, it must inform them and answer their requests; we help it do so.",
      ],
    },
    { title: "10. Changes", paras: ["We may update this policy. The update date is shown at the top of the page, and important changes are announced in advance."] },
  ],
};
