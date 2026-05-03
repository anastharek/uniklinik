import { Calendar, dayjsLocalizer } from "react-big-calendar";
import dayjs from "dayjs";

const localizer = dayjsLocalizer(dayjs);

const MyCalendar = (props) => (
  <div>
    {/* <Calendar
      localizer={localizer}
      events={[]}
      startAccessor="start"
      endAccessor="end"
    /> */}
    <h1 className="text-center">Coming soon..</h1>
  </div>
);

export default MyCalendar;
