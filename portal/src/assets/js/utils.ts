import { format, parseISO } from "date-fns";

// format date
export const formatLocalTime = (time: string): string => {
  if (time) {
    return format(new Date(parseISO(time || "")), "yyyy-MM-dd HH:mm:ss");
  } else {
    return "-";
  }
};
