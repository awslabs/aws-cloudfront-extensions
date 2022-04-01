import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import appReducer from "reducer/appReducer";
import { createStore } from "redux";
import { Provider } from "react-redux";
const store = createStore(appReducer);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
