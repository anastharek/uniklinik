import { useEffect, useState } from "react";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import apis from "../../../services/apis";
import { toast } from "react-toastify";

const AssignDoctor = ({
  className = "dropdown-item",
  study_id,
  patient_name,
  patient_id,
  accesor,
  study_type,
  study_date,
  StudyInstanceUID,
}) => {
  const [show, setShow] = useState(false);
  const [user, setUser] = useState([]);
  const [selected, setSelected] = useState([]);
  useEffect(() => {
    if (show && user.length == 0) {
      apis.caseList.getAllDoctor().then((res) => setUser(res));
      apis.caseList
        .getRerportData(study_id)
        .then((res) => setSelected(res.doctors))
        .catch((err) => console.log(err));
    }
  }, [show]);
  const toggle = () => {
    if (show) {
      onBlur();
    }
    setShow(!show);
  };

  //('show=>', show)
  const onBlur = () => {
    if (!selected.includes("")) {
      apis.caseList
        .assignDoctor(
          study_id,
          patient_name,
          patient_id,
          accesor,
          study_type||'',
          study_date,
          selected,
          StudyInstanceUID
        )
        .then(() => toast.success("assigned doctors !!"));
    }
  };
  return (
    <div style={{ maxWidth: 180 }} className="d-flex flex-column ">
      <button onClick={toggle} className={className} type="button">
        Assign Radiologist
      </button>
      {show ? (
        <div>
          <Typeahead
            multiple
            onChange={(selectedDoctor) => {
              setSelected(selectedDoctor.filter((element) => element != ""));
            }}
            options={user.map(
              (element) =>
                `Dr.  ${element.firstname} ${element.lastname} (${element.username})`
            )}
            selected={selected}
            id="doctors"
            placeholder="Assign Radiologist"
          />
        </div>
      ) : null}
    </div>
  );
};

export default AssignDoctor;
