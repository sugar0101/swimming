// Primero de todo: opciones globales antes de que los módulos definan sus
// funciones (los import se evalúan en orden).
import "./globals";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as auth from "./modules/auth";

admin.initializeApp();

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from swimming functions!");
});

export { auth };
