import { supabase } from "../supabaseClient";

interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, html, text },
    });

    if (error) {
      console.error("Error invoking send-email function:", error);
      return { success: false, error: error.message };
    }

    if (data?.success) {
      return { success: true };
    } else {
      return { success: false, error: data?.error || "Unknown error" };
    }
  } catch (err) {
    console.error("Unexpected error sending email:", err);
    return { success: false, error: "Unexpected error occurred" };
  }
}
