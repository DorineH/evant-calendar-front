import axios from "axios";

export interface ParsedApiError {
  fieldErrors: Record<string, string>;
  message: string;
}

/** Transforme n'importe quelle erreur (axios ou autre) en messages affichables. */
export function parseApiError(error: unknown): ParsedApiError {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return {
        fieldErrors: {},
        message:
          "Impossible de joindre le serveur. Vérifie ta connexion internet.",
      };
    }

    const data: any = error.response.data;
    const fieldErrors: Record<string, string> =
      data?.errors && typeof data.errors === "object" ? data.errors : {};

    const raw = data?.message;
    const message = Array.isArray(raw)
      ? raw.join("\n")
      : typeof raw === "string"
        ? raw
        : "Une erreur est survenue";

    return { fieldErrors, message };
  }

  return { fieldErrors: {}, message: "Une erreur est survenue" };
}
