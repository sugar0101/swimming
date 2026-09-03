import { setGlobalOptions } from "firebase-functions/v2";

// Primero de todo: fija región y techo de escalado antes de que los módulos
// definan sus funciones (los import se evalúan en orden).
setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
});
