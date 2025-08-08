import * as React from "react";
import styles from "../styles/NewsletterSignup.module.css";
import { submitSignup, type SubscribeRequest, type SubscribeResponse } from "../lib/api";

// Optional: Framer property controls (will be tree-shaken outside Framer)
// eslint-disable-next-line @typescript-eslint/no-var-requires
let addPropertyControls: any, ControlType: any;
try {
  // Dynamically require so the file works outside Framer too
  // @ts-ignore
  ({ addPropertyControls, ControlType } = require("framer"));
} catch (_) {}

type Props = {
  apiBaseUrl?: string;
  buttonLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  gdprText?: string;
  requireConsent?: boolean;
  nameLabel?: string;
  emailLabel?: string;
  companyLabel?: string;
  phoneLabel?: string;
  placeholders?: {
    name?: string;
    email?: string;
    companyName?: string;
    phoneNumber?: string;
  };
};

export function NewsletterSignup(props: Props) {
  const {
    apiBaseUrl,
    buttonLabel = "Subscribe",
    successMessage = "Thanks! You're subscribed.",
    errorMessage = "Something went wrong. Please try again.",
    gdprText =
      "I consent to receive marketing communications and agree to the processing of my data as described in the Privacy Policy.",
    requireConsent = true,
    nameLabel = "Name",
    emailLabel = "Email",
    companyLabel = "Company Name",
    phoneLabel = "Phone Number (optional)",
    placeholders = {},
  } = props;

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<
    | { type: "idle" }
    | { type: "success"; data: SubscribeResponse }
    | { type: "error"; message: string; data?: SubscribeResponse }
  >({ type: "idle" });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!companyName.trim()) nextErrors.companyName = "Company is required";
    if (!email.trim()) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Invalid email";
    if (requireConsent && !consent) nextErrors.consent = "Consent is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setStatus({ type: "idle" });
    try {
      const base = apiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
      if (!base) throw new Error("Missing apiBaseUrl");
      const payload: SubscribeRequest = { name, email, companyName, phoneNumber: phoneNumber || undefined, consent };
      const response = await submitSignup(base, payload);
      if (response.ok) {
        setStatus({ type: "success", data: response });
        setName("");
        setEmail("");
        setCompanyName("");
        setPhoneNumber("");
        setConsent(false);
      } else {
        setStatus({ type: "error", message: errorMessage, data: response });
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err?.message || errorMessage });
    } finally {
      setLoading(false);
    }
  }

  function renderStatus() {
    if (status.type === "success") {
      return (
        <div className={`${styles.status} ${styles.statusSuccess}`} role="status" aria-live="polite">
          {successMessage}
        </div>
      );
    }
    if (status.type === "error") {
      const bee = status.data?.results?.beehiiv;
      const hub = status.data?.results?.hubspot;
      return (
        <div className={`${styles.status} ${styles.statusError}`} role="alert" aria-live="assertive">
          {status.message}
          {bee && !bee.ok && <div>Beehiiv error: {bee.message || bee.status}</div>}
          {hub && !hub.ok && <div>HubSpot error: {hub.message || hub.status}</div>}
        </div>
      );
    }
    return <div className={styles.status} aria-live="polite" />;
  }

  return (
    <form className={styles.formRoot} onSubmit={onSubmit} noValidate>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name-input">
            {nameLabel}
          </label>
          <input
            id="name-input"
            className={styles.input}
            type="text"
            value={name}
            placeholder={placeholders.name || "Jane Doe"}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            required
          />
          {errors.name && (
            <div id="name-error" className={styles.errorText} role="alert">
              {errors.name}
            </div>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email-input">
            {emailLabel}
          </label>
          <input
            id="email-input"
            className={styles.input}
            type="email"
            value={email}
            placeholder={placeholders.email || "jane@example.com"}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            required
            inputMode="email"
            autoComplete="email"
          />
          {errors.email && (
            <div id="email-error" className={styles.errorText} role="alert">
              {errors.email}
            </div>
          )}
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="company-input">
            {companyLabel}
          </label>
          <input
            id="company-input"
            className={styles.input}
            type="text"
            value={companyName}
            placeholder={placeholders.companyName || "Acme Inc"}
            onChange={(e) => setCompanyName(e.target.value)}
            aria-invalid={Boolean(errors.companyName)}
            aria-describedby={errors.companyName ? "company-error" : undefined}
            required
            autoComplete="organization"
          />
          {errors.companyName && (
            <div id="company-error" className={styles.errorText} role="alert">
              {errors.companyName}
            </div>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone-input">
            {phoneLabel}
          </label>
          <input
            id="phone-input"
            className={styles.input}
            type="tel"
            value={phoneNumber}
            placeholder={placeholders.phoneNumber || "+1 555 0100"}
            onChange={(e) => setPhoneNumber(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className={styles.gdpr}>
        <input
          id="consent-input"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-invalid={Boolean(errors.consent)}
          aria-describedby={errors.consent ? "consent-error" : undefined}
        />
        <label htmlFor="consent-input">{gdprText}</label>
      </div>
      {errors.consent && (
        <div id="consent-error" className={styles.errorText} role="alert">
          {errors.consent}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={loading} aria-busy={loading}>
          {loading ? "Submitting…" : buttonLabel}
        </button>
        {renderStatus()}
      </div>
    </form>
  );
}

// Framer property controls
if (addPropertyControls && ControlType) {
  addPropertyControls(NewsletterSignup, {
    apiBaseUrl: { type: ControlType.String, title: "API Base URL" },
    buttonLabel: { type: ControlType.String, title: "Button Label", defaultValue: "Subscribe" },
    successMessage: { type: ControlType.String, title: "Success Message", defaultValue: "Thanks! You're subscribed." },
    errorMessage: { type: ControlType.String, title: "Error Message", defaultValue: "Something went wrong. Please try again." },
    requireConsent: { type: ControlType.Boolean, title: "Require Consent", defaultValue: true },
    gdprText: {
      type: ControlType.String,
      title: "GDPR Text",
      defaultValue:
        "I consent to receive marketing communications and agree to the processing of my data as described in the Privacy Policy.",
    },
    nameLabel: { type: ControlType.String, title: "Name Label", defaultValue: "Name" },
    emailLabel: { type: ControlType.String, title: "Email Label", defaultValue: "Email" },
    companyLabel: { type: ControlType.String, title: "Company Label", defaultValue: "Company Name" },
    phoneLabel: { type: ControlType.String, title: "Phone Label", defaultValue: "Phone Number (optional)" },
  });
}

export default NewsletterSignup;


