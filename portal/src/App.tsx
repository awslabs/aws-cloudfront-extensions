import React from "react";
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

import "./App.scss";
import Version from "pages/config/Version";
// import DeploymentStatusDetail from "pages/statusDetail/DeploymentStatusDetail";
import VersionDetail from "pages/config/detail/VersionDetail";
import SaveVersion from "pages/config/detail/SaveVersion";
import CompareVersion from "pages/config/detail/CompareVersion";
import DeployResult from "pages/deploy/DeployResult";
import Button from "components/Button";
import Certification from "pages/config/Certification";
import Create from "pages/config/certificate/Create";
import CNameList from "pages/config/CNameList";
import CloudFront from "pages/monitor/CloudFront";
import WAF from "pages/monitor/WAF";

const App: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <BrowserRouter>
        <Routes>
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
            path="/extentions/deploy"
            element={
              <Container>
                <Deploy />
              </Container>
            }
          />
          <Route
            path="/extentions/deploy-result"
            element={
              <Container>
                <DeployResult />
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
            path="/deployment-status/detail/:id"
            element={
              <Container>
                <DeployResult />
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
            path="/config/vesrsion/detail/:id"
            element={
              <Container>
                <VersionDetail />
              </Container>
            }
          />

          <Route
            path="/config/vesrsion/detail/:id/save"
            element={
              <Container>
                <SaveVersion />
              </Container>
            }
          />

          <Route
            path="/config/vesrsion/detail/:id/compare"
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
        </Routes>
      </BrowserRouter>
      <Footer />
    </div>
  );
};

export default App;
