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
import { useTranslation } from "react-i18next";

export const SideMenu: React.FC = () => {
  const openMenu: boolean = useSelector(
    (state: AppStateProps) => state.openSideMenu
  );
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const location = useLocation();

  const SIDE_MENU_LIST = [
    // {
    //   name: "Deployment status",
    //   link: "/deployment-status",
    //   subMenu: [],
    //   open: true,
    // },
    {
      name: "menu.monitoring",
      link: "/monitor",
      subMenu: [
        {
          name: "menu.cloudFrontTraffic",
          link: "/monitor/cloudfront",
        },
      ],
      open: true,
    },
    {
      name: "menu.distributionMgmt",
      link: "/config",
      subMenu: [
        {
          name: "menu.snapshot",
          link: "/config/snapshot",
        },
        {
          name: "menu.changeHistory",
          link: "/config/version",
        },
        {
          name: "menu.certificates",
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
      name: "menu.extensions",
      link: "/extentions-repository",
      subMenu: [
        {
          name: "menu.repository",
          link: "/extentions-repository",
        },
      ],
      open: true,
    },
  ];
  const [sideMenuList, setSideMenuList] = useState(SIDE_MENU_LIST);

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
              <a href="/">{t("name")}</a>
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
                      {t(element.name)}
                    </div>
                  ) : (
                    <div
                      className={
                        location.pathname === element.link ? "active" : ""
                      }
                    >
                      <Link to={element.link}>{t(element.name)}</Link>
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
                              <Link to={subItem.link}>{t(subItem.name)}</Link>
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
                <ExtLink to="/">{t("menu.doc")}</ExtLink>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideMenu;
