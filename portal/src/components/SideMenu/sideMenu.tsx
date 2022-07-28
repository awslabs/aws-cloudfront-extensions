import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CloseIcon from "@material-ui/icons/Close";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import MenuIcon from "@material-ui/icons/Menu";
import ExtLink from "../ExtLink";

import { useSelector, useDispatch } from "react-redux";
import { ActionType } from "../../reducer/appReducer";
import { AppStateProps } from "../../reducer/appReducer";
import { SIDE_BAR_OPEN_STORAGE_ID } from "../../reducer/appReducer";

const SOLUSTION_NAME = "CloudFront Extensions";
const SIDE_MENU_LIST = [
  {
    name: "Extensions repository",
    link: "/extentions-repository",
    subMenu: [],
    open: true,
  },
  // {
  //   name: "Deployment status",
  //   link: "/deployment-status",
  //   subMenu: [],
  //   open: true,
  // },
  {
    name: "Configuration",
    link: "/config",
    subMenu: [
      {
        name: "ChangeLog",
        link: "/config/version",
      },
      {
        name: "Snapshot",
        link: "/config/snapshot",
      },
      {
        name: "SSL for SAAS",
        link: "/config/certification/list",
      },
      // {
      //   name: "SSL for SAAS(Mock UI)",
      //   link: "/config/sslcertificate/list",
      // },
    ],
    open: true,
  },
  {
    name: "Monitoring",
    link: "/monitor",
    subMenu: [
      {
        name: "CloudFront",
        link: "/monitor/cloudfront",
      },
      {
        name: "WAF",
        link: "/monitor/waf",
      },
    ],
    open: true,
  },
];

export const SideMenu: React.FC = () => {
  const openMenu: boolean = useSelector(
    (state: AppStateProps) => state.openSideMenu
  );
  const [sideMenuList, setSideMenuList] = useState(SIDE_MENU_LIST);
  const dispatch = useDispatch();
  const location = useLocation();
  return (
    <div
      className="gsui-side-menu"
      style={{ marginLeft: openMenu ? undefined : -240 }}
    >
      {!openMenu && (
        <div
          className="collapse-menu"
          onClick={() => {
            localStorage.setItem(SIDE_BAR_OPEN_STORAGE_ID, "open");
            dispatch({ type: ActionType.OPEN_SIDE_MENU });
          }}
        >
          <MenuIcon className="menu-icon" />
        </div>
      )}
      {openMenu && (
        <div className="flex-1">
          <div>
            <CloseIcon
              onClick={() => {
                localStorage.setItem(SIDE_BAR_OPEN_STORAGE_ID, "close");
                dispatch({ type: ActionType.CLOSE_SIDE_MENU });
              }}
              className="close-icon"
            />
            <div className="head-title">
              <a href="/">{SOLUSTION_NAME}</a>
            </div>
            {sideMenuList.map((element, index) => {
              return (
                <div className="menu-item" key={index}>
                  {element.subMenu && element.subMenu.length > 0 ? (
                    <div
                      className="collapse-title"
                      onClick={() => {
                        setSideMenuList((prev) => {
                          const tmpMenu = JSON.parse(JSON.stringify(prev));
                          tmpMenu[index].open = !tmpMenu[index].open;
                          return tmpMenu;
                        });
                      }}
                    >
                      <i className="icon">
                        <ArrowDropDownIcon
                          className={element.open ? "" : "reverse-90"}
                        />
                      </i>
                      {element.name}
                    </div>
                  ) : (
                    <div
                      className={
                        location.pathname === element.link ? "active" : ""
                      }
                    >
                      <Link to={element.link}>{element.name}</Link>
                    </div>
                  )}
                  {element.subMenu &&
                    element.subMenu.length > 0 &&
                    element.open && (
                      <div>
                        {element.subMenu.map((subItem, index) => {
                          return (
                            <div
                              key={index}
                              className={
                                location.pathname === subItem.link
                                  ? "active"
                                  : ""
                              }
                            >
                              <Link to={subItem.link}>{subItem.name}</Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              );
            })}

            <div className="external-link">
              <div>
                <ExtLink to="/">Documentation</ExtLink>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideMenu;
