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
import Version from "pages/config/Version/Version";
// import DeploymentStatusDetail from "pages/statusDetail/DeploymentStatusDetail";
import VersionDetail from "pages/config/Version/VersionDetail";
import SaveVersion from "pages/config/Version/SaveVersion";
import CompareVersion from "pages/config/Version/CompareVersion";
import Button from "components/Button";
import Certification from "pages/config/Certification";
import Create from "pages/config/certificate/Create";
import CertificationList from "pages/config/CertificationList";
import CloudFront from "pages/monitor/CloudFront";
import WAF from "pages/monitor/WAF";
import { AmplifyConfigType } from "assets/js/type";
import { AMPLIFY_CONFIG_JSON } from "assets/js/const";
import LoadingText from "components/LoadingText";
import { ActionType } from "reducer/appReducer";
import { useDispatch } from "react-redux";
import VersionDetailDisplay from "./pages/config/Version/VersionDetailDisplay";
import ConfigCertificate from "./pages/config/certificate/steps/ConfigCertificate";
import Snapshot from "./pages/config/Snapshot/Snapshot";
import SnapshotDetail from "./pages/config/Snapshot/SnapshotDetail";
import SaveSnapshot from "./pages/config/Snapshot/SaveSnapshot";
import SnapshotDetailDisplay from "./pages/config/Snapshot/SnapshotDetailDisplay";
import CompareSnapshot from "./pages/config/Snapshot/CompareSnapshot";

import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

const SignInRouter: React.FC = () => {
  return (
    <Authenticator signUpAttributes={["email"]}>
      {({ signOut, user }) => {
        return (
          <>
            <Header signOut={signOut} user={user} />;
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
                  path="/extentions/deploy/:extName/:status"
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
                  path="/config/version/detail/:id/:version/save/:note"
                  element={
                    <Container>
                      <SaveVersion />
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
                  path="/config/version/detail/display/:id/:version"
                  element={
                    <Container>
                      <VersionDetailDisplay />
                    </Container>
                  }
                />

          <Route
            path="/config/version/detail/:id/compare/:ver1/:ver2"
            element={
              <Container>
                <CompareVersion />
              </Container>
            }
          />

          <Route
            path="/config/Snapshot"
            element={
              <Container>
                <Snapshot />
              </Container>
            }
          />

          <Route
            path="/config/snapshot/detail/:id"
            element={
              <Container>
                <SnapshotDetail />
              </Container>
            }
          />

          <Route
            path="/config/snapshot/detail/:id/:snapshot/save/:note"
            element={
              <Container>
                <SaveSnapshot />
              </Container>
            }
          />
          <Route
            path="/config/snapshot/detail/:id/:snapshot/save"
            element={
              <Container>
                <SaveSnapshot />
              </Container>
            }
          />

          <Route
            path="/config/snapshot/detail/display/:id/:snapshot"
            element={
              <Container>
                <SnapshotDetailDisplay />
              </Container>
            }
          />

          <Route
            path="/config/snapshot/detail/:id/compare/:snapshot1/:snapshot2"
            element={
              <Container>
                <CompareSnapshot />
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
                      <ConfigCertificate />
                    </Container>
                  }
                />

                <Route
                  path="/config/certification/list"
                  element={
                    <Container>
                      <CertificationList />
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
      }}
    </Authenticator>
  );
};

const App: React.FC = () => {
  const [loadingConfig, setLoadingConfig] = useState(true);
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
      Amplify.configure(configData);
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
