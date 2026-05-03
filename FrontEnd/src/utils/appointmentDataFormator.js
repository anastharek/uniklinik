const dataFormator=(data)=>{
 if(data['Appointment Date'] && data["Appointment Time"]){
    let temp=new Date(data['Appointment Date']);
    temp.setHours(data["Appointment Time"].split(':')[0])
    temp.setMinutes(data["Appointment Time"].split(':')[1])
    data.appointment_datetime=temp;
 }
 else if(data['Appointment Date']){
    //data.date=data['Appointment Date'];
    let prev=new Date(data.appointment_datetime)
    let current=new Date(data['Appointment Date']);
    current.setHours(prev.getHours());
    current.setMinutes(prev.getMinutes());
    data.appointment_datetime=current;

 }
 else if(data["Appointment Time"]){
    let current=new Date(data.appointment_datetime)
    current.setHours(data["Appointment Time"].split(':')[0]);
    current.setMinutes(data["Appointment Time"].split(':')[1]);
    data.appointment_datetime=current;
 }

 if(data['Name'])data.Patient.name=data['Name'];
 if(data['NRIC'])data.Patient.nric=data['NRIC'];
 if(data['DOB'])data.Patient.dob=data['DOB'];
 if(data["Patient Type"])data.patient_type=data["Patient Type"];
 if(data["Allergic"])data.Patient.allergic=data["Allergic"];
 if(data["Asthma"])data.Patient.Asthma=data["Asthma"];
 if(data["Creatinine"])data.Creatinine=data["Creatinine"];
 if(data["Clinical Summary"])data.clinical_summary=data["Clinical Summary"];
 console.log('data giving ',data)
 return data;
}
export default dataFormator;