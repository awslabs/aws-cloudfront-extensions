import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import App from "./App";
import appReducer from "reducer/appReducer";
import { createStore } from "redux";
import { Provider } from "react-redux";
import "./i18n";
const store = createStore(appReducer);

ReactDOM.render(
  <Provider store={store}>
    <Suspense fallback={<div className="loading"></div>}>
      <App />
    </Suspense>
  </Provider>,
  document.getElementById("root")
);
