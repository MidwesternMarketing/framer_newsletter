export type SubscribeRequest = {
  name: string;
  email: string;
  companyName: string;
  phoneNumber?: string;
  consent: boolean;
};

export type IntegrationResult = {
  ok: boolean;
  status?: number;
  message?: string;
};

export type SubscribeResponse = {
  ok: boolean;
  results: {
    beehiiv: IntegrationResult;
    hubspot: IntegrationResult;
  };
};

export async function submitSignup(
  apiBaseUrl: string,
  payload: SubscribeRequest
): Promise<SubscribeResponse> {
  const url = `${apiBaseUrl.replace(/\/$/, "")}/api/subscribe`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Subscribe request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as SubscribeResponse;
}

