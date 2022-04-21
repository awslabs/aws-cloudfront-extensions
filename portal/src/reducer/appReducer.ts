import { AmplifyConfigType } from "assets/js/type";

// import { AnyAction } from "redux";
export const SIDE_BAR_OPEN_STORAGE_ID =
  "__solutions__side_bar_open_storage_id__";

export enum ActionType {
  CLOSE_SIDE_MENU,
  OPEN_SIDE_MENU,
  OPEN_INFO_BAR,
  CLOSE_INFO_BAR,
  SET_INFO_BAR_TYPE,
  UPDATE_AMPLIFY_CONFIG,
}

export enum InfoBarTypes {
  ALARMS = "ALARMS",
}

export const InfoBarTitleMap: any = {
  ALARMS: "info:alarm.name",
};

export interface AppStateProps {
  openSideMenu: boolean;
  showInfoBar: boolean;
  infoBarType: InfoBarTypes | undefined;
  amplifyConfig: any;
}

const initialState: AppStateProps = {
  openSideMenu:
    localStorage.getItem(SIDE_BAR_OPEN_STORAGE_ID) === "close" ? false : true,
  showInfoBar: false,
  amplifyConfig: {},
  infoBarType: undefined,
};

export type Action =
  | {
      type: ActionType.OPEN_INFO_BAR;
    }
  | {
      type: ActionType.CLOSE_INFO_BAR;
    }
  | {
      type: ActionType.SET_INFO_BAR_TYPE;
      infoBarType: InfoBarTypes | undefined;
    }
  | {
      type: ActionType.UPDATE_AMPLIFY_CONFIG;
      amplifyConfig: AmplifyConfigType;
    }
  | {
      type: ActionType.OPEN_SIDE_MENU;
    }
  | {
      type: ActionType.CLOSE_SIDE_MENU;
    };

const appReducer = (state = initialState, action: Action): AppStateProps => {
  switch (action.type) {
    case ActionType.OPEN_INFO_BAR:
      return { ...state, showInfoBar: true };
    case ActionType.CLOSE_INFO_BAR:
      return { ...state, showInfoBar: false };
    case ActionType.SET_INFO_BAR_TYPE:
      return { ...state, infoBarType: action.infoBarType };
    case ActionType.UPDATE_AMPLIFY_CONFIG:
      return { ...state, amplifyConfig: action.amplifyConfig };
    case ActionType.OPEN_SIDE_MENU:
      return { ...state, openSideMenu: true };
    case ActionType.CLOSE_SIDE_MENU:
      return { ...state, openSideMenu: false };

    default:
      return state;
  }
};

export default appReducer;
