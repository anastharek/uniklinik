import React, { useEffect } from "react";
import AsyncSelect from "react-select/async/dist/react-select.esm";
import { FormControl } from "react-bootstrap";
import apis from "../../../../services/apis";
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import { toast } from 'react-toastify';


export function InputCell({
    value: initialValue,
    row: { values },
    column: { id, accessor, type,editable },
    onDataChange,
    formatter
}) {
    type = type || 'text'
    

    // We need to keep and update the state of the cell normally
    const [value, setValue] = React.useState(initialValue)
    const [toggled, setToggled] = React.useState(false)

    // If the initialValue is changed external, sync it up with our state
    React.useEffect(() => {
        setValue(initialValue)
    }, [initialValue]);


    const onChange = e => {
        setValue(e.target.value)
    }

    // We'll only update the external data when the input is blurred
    const onBlur = () => {
        setToggled(false);
        if (onDataChange) onDataChange(initialValue, value, values, id || accessor)
    }
    return toggled ? <FormControl autoFocus={true} type={type} value={value} onChange={onChange} onBlur={onBlur}
    /> :
        <div style={{ 'height': '100%', 'minWidth': '50px', padding: 0, display: 'flex' }}
            onClick={() => {
                if(editable===false)return;
                if ( values.editable === undefined || values.editable) setToggled(true)
            }}>
            <p>{formatter ?formatter(value):value?.toString()}</p>
        </div>

}



export function SelectFilter({
    value: initialValue,
    row: { values },
    column: { id, accessor, type },
    onDataChange,
}) {
    type = type || 'text'
    // We need to keep and update the state of the cell normally
    const [value, setValue] = React.useState(initialValue)
    const [toggled, setToggled] = React.useState(false)
    const [tags, setTags] = React.useState([])

    // If the initialValue is changed external, sync it up with our state
    React.useEffect(() => {
        setValue(initialValue)

    }, [initialValue]);




    // We'll only update the external data when the input is blurred
    const onBlur = () => {
        setToggled(false);
        if (initialValue !== value)
            apis.caseList.updateDoctors(values.study_id, value, values.addendumby === undefined)
                .then(() => toast.success('updated doctors !!'))
    }

    return toggled ? <Typeahead
        style={{ maxWidth: 250 }}
        multiple
        onFocus={() => apis.caseList.getAllDoctor().then(res => setTags(res))}
        onBlur={onBlur}
        onChange={(selected) => { setValue(selected) }}
        options={tags.map((element) => `Dr. ${element.firstname}  ${element.lastname} (${element.username})`)}
        selected={value}
        id='doctors'
    /> :
        <div style={{ 'height': '100%', 'minWidth': '50px', padding: 0, display: 'flex' }}
            onClick={() => {
                if (values.editable === undefined || values.editable) setToggled(true)
            }}>
            <p style={{ maxWidth: 250 }}>{value?.join(' , ')}</p>
        </div>

}

export function SelectLabels({
    value: initialValue,
    row: { values },
    column: { id, accessor, type,editable },
    onDataChange,
}) {
    type = type || 'text'
    // We need to keep and update the state of the cell normally
    const [value, setValue] = React.useState(initialValue?initialValue.split(',').map((ele,index)=>({label:ele,id:index})):[])
    const [toggled, setToggled] = React.useState(false)

    useEffect(()=>{
        setValue(initialValue?initialValue.split(',').map((ele,index)=>({label:ele,id:index})):[])
    },[initialValue])
    // If the initialValue is changed external, sync it up with our state
    // React.useEffect(() => {
    //     setValue(initialValue)

    // }, [initialValue]);




    // We'll only update the external data when the input is blurred
    const onBlur = () => {
        setToggled(false);
        let strLabel=value.map(ele=>ele.label).toString()
        // if (onDataChange) onDataChange(initialValue, value, values, id || accessor)
        if (initialValue !== strLabel)
            apis.caseList.updateLabels(values.study_id,strLabel)
                .then(() => toast.success('updated labels !!'))
    }

    //const onChange=(e)=>setValue(e.target.value)
    return <div style={{minWidth:'120px',height:'100%'}}>{toggled ? 
        <Typeahead
        style={{ maxWidth: 250 }}
        multiple
        onBlur={onBlur}
        options={[]}
        allowNew
        newSelectionPrefix
        onChange={(selected) => { setValue(selected) }}
        selected={value}
        id="labels"
    /> :
        <div style={{ 'height': '100%', 'minWidth': '100px', padding: 0, display: 'flex' }}
            onClick={() => {
                if (editable === undefined || editable==true) setToggled(true)
            }}>
            <p style={{ maxWidth: 250 }}>{value.map(ele=>ele.label).toString()}</p>
        </div>
        }
    </div>

}

export function SelectCell({
    value: initialValue,
    row: { values },
    column: { id, accessor, options },
    onDataChange, // This is a custom function that we supplied to our table instance
}) {

    const [value, setValue] = React.useState(null);

    const onChange = value => {
        setValue(value);
        if (onDataChange) onDataChange(initialValue, value.value, values, id || accessor)
    }

    return <div>
        <AsyncSelect className={'react-select'} single defaultOptions value={value}
            loadOptions={() => options().then(res => {
                setValue(res.find(x => x.value === initialValue))
                return res;
            })} onChange={onChange}
            style={{ 'min-width': '100px' }}
            menuPosition={'fixed'}
        />
    </div>

}
