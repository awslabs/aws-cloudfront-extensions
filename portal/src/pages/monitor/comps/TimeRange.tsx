import React, { useState, useEffect } from "react";
import DateRangePicker from "@cloudscape-design/components/date-range-picker";
import moment from "moment";

const SPECIFY_TIME_ITEMS = ["1h", "3h", "12h", "1d", "3d", "1w", "Custom"];

export const TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

const buildPreTime = (nowTime: Date, period: string) => {
  // const nowTimeUTC = moment(nowTime).utc().toDate().getTime();
  console.info("nowTime:", nowTime);
  const utcTime = moment.utc(nowTime).format(TIME_FORMAT);
  console.info("nowUTCTime", utcTime);
  const nowUTCTimeStamp = new Date(utcTime).getTime();
  console.info("nowUTCTimeStamp:", nowUTCTimeStamp);
  switch (period) {
    case "1h":
      return Math.floor(nowUTCTimeStamp - 1000 * 60 * 60);
    case "3h":
      return Math.floor(nowUTCTimeStamp - 1000 * 60 * 60 * 3);
    case "12h":
      return Math.floor(nowUTCTimeStamp - 1000 * 60 * 60 * 12);
    case "1d":
      return Math.floor(nowUTCTimeStamp - 1000 * 60 * 60 * 24);
    case "3d":
      return Math.floor(nowUTCTimeStamp - 1000 * 60 * 60 * 24 * 3);
    case "1w":
      return Math.floor(nowUTCTimeStamp - 1000 * 60 * 60 * 24 * 7);
    default:
      return Math.floor(nowUTCTimeStamp);
  }
};

interface TimeRangeProps {
  curTimeRangeType: string;
  startTime: string;
  endTime: string;
  changeTimeRange: (timeRange: any) => void;
  changeRangeType: (rangeType: string) => void;
}

const TimeRange: React.FC<TimeRangeProps> = (props: TimeRangeProps) => {
  const {
    curTimeRangeType,
    startTime,
    endTime,
    changeRangeType,
    changeTimeRange,
  } = props;
  // const [curSpecifyRange, setCurSpecifyRange] = useState(curTimeRangeType);
  const [dataRange, setDataRange] = useState<any>({
    type: "absolute",
    startDate: "",
    endDate: "",
  });
  // console.info("")
  useEffect(() => {
    console.info("[startTime, endTime]:", startTime, endTime);
    const startTimeInput = moment.utc(startTime).format("YYYY-MM-DDTHH:mm:ssZ");
    const endTimeInput = moment.utc(endTime).format("YYYY-MM-DDTHH:mm:ssZ");
    // console.info("aaaa:", aaaa);
    setDataRange({
      type: "absolute",
      startDate: startTimeInput,
      endDate: endTimeInput,
    });
  }, [startTime, endTime]);

  useEffect(() => {
    if (curTimeRangeType !== "Custom") {
      const now = new Date();
      const preTime = buildPreTime(now, curTimeRangeType);
      const preTimeFormat = moment(preTime).format(TIME_FORMAT);
      const nowTimeFormat = moment.utc(now).format(TIME_FORMAT);
      changeTimeRange([preTimeFormat, nowTimeFormat]);
    }
  }, [curTimeRangeType]);

  return (
    <>
      <div className="time-select-content">
        <div className="specify-time">
          {SPECIFY_TIME_ITEMS.map((element, index) => {
            return (
              <span
                key={index}
                className={`item ${
                  curTimeRangeType === element ? "item-active" : ""
                }`}
                onClick={() => {
                  changeRangeType(element);
                }}
              >
                {element}
              </span>
            );
          })}
        </div>
        <div>
          {curTimeRangeType === "Custom" && (
            <DateRangePicker
              isValidRange={() => {
                return { valid: true };
              }}
              i18nStrings={{
                todayAriaLabel: "Today",
                nextMonthAriaLabel: "Next month",
                previousMonthAriaLabel: "Previous month",
                customRelativeRangeDurationLabel: "Duration",
                customRelativeRangeDurationPlaceholder: "Enter duration",
                customRelativeRangeOptionLabel: "Custom range",
                customRelativeRangeOptionDescription:
                  "Set a custom range in the past",
                customRelativeRangeUnitLabel: "Unit of time",
                formatRelativeRange: (e) => {
                  const n = 1 === e.amount ? e.unit : `${e.unit}s`;
                  return `Last ${e.amount} ${n}`;
                },
                formatUnit: (e, n) => (1 === n ? e : `${e}s`),
                relativeModeTitle: "Relative range",
                absoluteModeTitle: "Absolute range",
                relativeRangeSelectionHeading: "Choose a range",
                startDateLabel: "Start date",
                endDateLabel: "End date",
                startTimeLabel: "Start time",
                endTimeLabel: "End time",
                clearButtonLabel: "Clear and dismiss",
                cancelButtonLabel: "Cancel",
                applyButtonLabel: "Apply",
              }}
              onChange={({ detail }: any) => {
                console.info("change time range");
                console.info(detail.value);
                const tmpStartTime = detail.value?.startDate;
                const tmpEndTime = detail.value?.endDate;
                const startTimeStr = moment
                  .utc(tmpStartTime)
                  .format(TIME_FORMAT);
                const endTimeStr = moment.utc(tmpEndTime).format(TIME_FORMAT);
                console.info(
                  "startTimeStr:endTimeStr:",
                  startTimeStr,
                  endTimeStr
                );
                changeTimeRange([startTimeStr, endTimeStr]);
              }}
              value={dataRange}
              relativeOptions={[
                {
                  key: "previous-5-minutes",
                  amount: 5,
                  unit: "minute",
                  type: "relative",
                },
                {
                  key: "previous-30-minutes",
                  amount: 30,
                  unit: "minute",
                  type: "relative",
                },
                {
                  key: "previous-1-hour",
                  amount: 1,
                  unit: "hour",
                  type: "relative",
                },
                {
                  key: "previous-6-hours",
                  amount: 6,
                  unit: "hour",
                  type: "relative",
                },
              ]}
              placeholder="Filter by a date and time range"
              rangeSelectorMode="absolute-only"
              timeOffset={0}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default TimeRange;
