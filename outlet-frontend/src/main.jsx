import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { Provider } from "react-redux";
import { store } from "./redux/store";


const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* ✅ Redux Provider wraps entire app */}
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);