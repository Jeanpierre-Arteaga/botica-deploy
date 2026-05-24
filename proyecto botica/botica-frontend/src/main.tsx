import { createRoot } from "react-dom/client";
import { initMercadoPago } from "@mercadopago/sdk-react";
import App from "./app/App.tsx";
import "./styles/index.css";

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined;
if (MP_PUBLIC_KEY) {
  initMercadoPago(MP_PUBLIC_KEY, { locale: "es-PE" });
} else {
  console.warn(
    "VITE_MP_PUBLIC_KEY no definida en .env. MercadoPago Brick no funcionará."
  );
}

createRoot(document.getElementById("root")!).render(<App />);
