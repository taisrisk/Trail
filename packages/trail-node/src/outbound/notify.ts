import notifier from "node-notifier";

export function notifyDesktop(title: string, message: string) {
  try {
    notifier.notify({
      title,
      message,
      appID: "Trail Local OS",
      sound: true,
      wait: false,
    });
  } catch (err: unknown) {
    console.error("[Notification] Failed to send OS desktop notification:", err instanceof Error ? err.message : String(err));
  }
}
