import { useEffect, useState } from "react";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import apis from "../../../services/apis";
import { toast } from "react-toastify";

const AssignByRole = ({
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
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState([]);
  useEffect(() => {
    if (show && roles.length == 0) {
      fetch("/api/roles-name/all")
        .then((res) => res.json())
        .then(setRoles);
      apis.caseList
        .getRerportData(study_id)
        .then((res) => setSelected(res.roles))
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
        .assignRoles(
          study_id,
          patient_name,
          patient_id,
          accesor,
          study_type||'',
          study_date,
          selected,
          StudyInstanceUID
        )
        .then(() => toast.success("assigned roles  !!"));
    }
  };
  return (
    <div style={{ maxWidth: 180 }} className="d-flex flex-column ">
      <button onClick={toggle} className={className} type="button">
        Assign By Roles
      </button>
      {show ? (
        <div>
          <Typeahead
            multiple
            onChange={(selectedDoctor) => {
              setSelected(selectedDoctor.filter((element) => element != ""));
            }}
            options={roles.map(
              (element) =>
                `${element.name}`
            )}
            selected={selected}
            id="roles"
            placeholder="Assign By Roles"
          />
        </div>
      ) : null}
    </div>
  );
};

export default AssignByRole;
