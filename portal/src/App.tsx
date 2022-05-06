import React, { useState, useEffect } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Container from "./components/layouts/PageContainer";
import Footer from "./components/layouts/PageFooter";
import Header from "./components/layouts/PageHeader";
import "./components/styles/index.scss";
import Home from "pages/Home";
import Demo from "pages/Demo";
import Repository from "pages/Repository";
import DeploymentStatus from "pages/DeploymentStatus";
import Deploy from "pages/deploy/Deploy";
import Axios from "axios";

import "./App.scss";
import Version from "pages/config/Version";
// import DeploymentStatusDetail from "pages/statusDetail/DeploymentStatusDetail";
import VersionDetail from "pages/config/detail/VersionDetail";
import SaveVersion from "pages/config/detail/SaveVersion";
import CompareVersion from "pages/config/detail/CompareVersion";
import Button from "components/Button";
import Certification from "pages/config/Certification";
import Create from "pages/config/certificate/Create";
import CNameList from "pages/config/CNameList";
import CloudFront from "pages/monitor/CloudFront";
import WAF from "pages/monitor/WAF";
import { AmplifyConfigType } from "assets/js/type";
import { AMPLIFY_CONFIG_JSON } from "assets/js/const";
import LoadingText from "components/LoadingText";
import { ActionType } from "reducer/appReducer";
import { useDispatch } from "react-redux";

const SignInRouter: React.FC = () => {
  return (
    <>
      <Header />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Container disablePadding hideHelpPanel>
                <Home />
              </Container>
            }
          />
          <Route
            path="/extentions-repository"
            element={
              <Container>
                <Repository />
              </Container>
            }
          />
          <Route
            path="/extentions/deploy/:extName"
            element={
              <Container>
                <Deploy />
              </Container>
            }
          />

          <Route
            path="/deployment-status"
            element={
              <Container>
                <DeploymentStatus />
              </Container>
            }
          />

          <Route
            path="/config/version"
            element={
              <Container>
                <Version />
              </Container>
            }
          />

          <Route
            path="/config/version/detail/:id"
            element={
              <Container>
                <VersionDetail />
              </Container>
            }
          />

          <Route
            path="/config/version/detail/:id/:version/save"
            element={
              <Container>
                <SaveVersion />
              </Container>
            }
          />

          <Route
            path="/config/version/detail/:id/compare"
            element={
              <Container>
                <CompareVersion />
              </Container>
            }
          />

          <Route
            path="/config/certification"
            element={
              <Container>
                <Certification />
              </Container>
            }
          />

          <Route
            path="/config/certification/create"
            element={
              <Container>
                <Create />
              </Container>
            }
          />

          <Route
            path="/config/certification/list"
            element={
              <Container>
                <CNameList />
              </Container>
            }
          />

          <Route
            path="/monitor/cloudfront"
            element={
              <Container>
                <CloudFront />
              </Container>
            }
          />

          <Route
            path="/monitor/waf"
            element={
              <Container>
                <WAF />
              </Container>
            }
          />

          <Route
            path="/demo/:id"
            element={
              <Container>
                <Demo />
              </Container>
            }
          />

          <Route
            path="*"
            element={
              <Container>
                <div className="not-found">
                  <h1>404 Page Not Found</h1>
                  <Link to="/">
                    <Button>Home</Button>
                  </Link>
                </div>
              </Container>
            }
          />
        </Routes>
      </BrowserRouter>
      <Footer />
    </>
  );
};

const App: React.FC = () => {
  const [loadingConfig, setLoadingConfig] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    const timeStamp = new Date().getTime();
    Axios.get(`/aws-exports.json?timestamp=${timeStamp}`).then((res) => {
      const configData: AmplifyConfigType = res.data;
      dispatch({
        type: ActionType.UPDATE_AMPLIFY_CONFIG,
        amplifyConfig: configData,
      });
      localStorage.setItem(AMPLIFY_CONFIG_JSON, JSON.stringify(res.data));
      setLoadingConfig(false);
    });
  }, []);

  return (
    <div className="App">
      {loadingConfig ? <LoadingText /> : <SignInRouter />}
    </div>
  );
};

export default App;
