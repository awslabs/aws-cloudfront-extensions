import { format, parseISO } from "date-fns";

// format date
export const formatLocalTime = (time: string): string => {
  if (time) {
    return format(new Date(parseISO(time || "")), "yyyy-MM-dd HH:mm:ss");
  } else {
    return "-";
  }
};

export const nFormatter = (num: any, digits: any) => {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
    : "0";
};
