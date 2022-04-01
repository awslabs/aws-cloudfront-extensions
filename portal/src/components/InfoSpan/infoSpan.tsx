import React from "react";
import { useDispatch } from "react-redux";
import { ActionType, InfoBarTypes } from "reducer/appReducer";

interface spanInfo {
  spanType: InfoBarTypes | undefined;
}

const InfoSpan: React.FC<spanInfo> = (props: spanInfo) => {
  const { spanType } = props;
  const dispatch = useDispatch();
  const openInfoBar = React.useCallback(() => {
    dispatch({ type: ActionType.OPEN_INFO_BAR });
    dispatch({ type: ActionType.SET_INFO_BAR_TYPE, infoBarType: spanType });
  }, [dispatch, spanType]);
  return (
    <span className="gsui-info-span" onClick={openInfoBar}>
      Info
    </span>
  );
};

export default InfoSpan;
