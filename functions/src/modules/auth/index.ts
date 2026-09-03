import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { auth } from "firebase-functions/v1";
import { onCall, HttpsError } from "firebase-functions/v2/https";

// Al crear un usuario en Firebase Auth se crea su doc de autorización.
// Las reglas de Firestore no permiten escribir `authorization/*` desde el
// cliente: la única fuente es esta función (Admin SDK).
export const onUserCreated = auth.user().onCreate(async (user) => {
  const db = admin.firestore();

  await db.doc(`authorization/${user.uid}`).set(
    {
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      role: "member",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  logger.info("authorization doc created", { uid: user.uid });
});

// Callable de ejemplo: devuelve el perfil de autorización del usuario.
export const me = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const snap = await admin
    .firestore()
    .doc(`authorization/${request.auth.uid}`)
    .get();

  return { uid: request.auth.uid, ...(snap.data() ?? {}) };
});
