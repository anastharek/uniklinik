import { useEffect, useMemo, useState } from "react";
import socket from "../../../socket/socket";
import AreaChart from "../../Chart/AreaChart";

const SystemMonitoring = () => {
  const [data, setData] = useState([]);
  const [socketData, setSocketData] = useState({});
  const [userCount,setUserCount]=useState(0);
  useEffect(() => {
    fetch("/api/system-usage")
      .then((res) => res.json())
      .then((resJson) => {setData(resJson.data);setUserCount(resJson.user_count)})
      .catch((err) => console.log(err));
    socket.emit("getusage");

    socket.on("usage", (payload) => {
      setSocketData(payload);
    });

    let interval = setInterval(() => {
      socket.emit("getusage");
    }, 2000);
    return () => {
      clearInterval(interval);
      socket.off("usage");
    };
  }, []);
  const calculated_data = useMemo(() => {
    let obj = {};
    obj.user_count = data.map(({ user_count }) => user_count);
    obj.system_usage = data.map(({ system_usage }) => system_usage);
    obj.createdAt = data.map(({ createdAt }) => createdAt);
    return obj;
  }, [data]);
  return (
    <div className="container-fluid">
      <div className="col-12 mb-5">
        <span className=" me-5 h5">active users : {userCount}</span>
        <span className="me-5  h5">
          total memory :{" "}
          {(socketData.total_memory / (1024 * 1024 * 1024)).toFixed(1)} GB
        </span>
        <span className="me-5  h5">
          free memory :{" "}
          {(socketData.free_memory / (1024 * 1024 * 1024)).toFixed(1)} GB
        </span>
      </div>
      <div>
        <h5>Connected Users</h5>
        <AreaChart
          series={calculated_data.user_count}
          category={calculated_data.createdAt}
          name="users"
        />
      </div>
      <div>
        <h5>System Activity</h5>
        <AreaChart
          series={calculated_data.system_usage}
          category={calculated_data.createdAt}
          name="system usage"
        />
      </div>
    </div>
  );
};
export default SystemMonitoring;
