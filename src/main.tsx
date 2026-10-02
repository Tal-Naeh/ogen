import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Shell } from "./components/Shell";
import { StoreProvider } from "./lib/store";
import { Accounts } from "./pages/Accounts";
import { Assistant } from "./pages/Assistant";
import { Budgets } from "./pages/Budgets";
import { Dashboard } from "./pages/Dashboard";
import { Recurring } from "./pages/Recurring";
import { Transactions } from "./pages/Transactions";

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/transactions", element: <Transactions /> },
      { path: "/budgets", element: <Budgets /> },
      { path: "/recurring", element: <Recurring /> },
      { path: "/accounts", element: <Accounts /> },
      { path: "/assistant", element: <Assistant /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  </StrictMode>,
);
