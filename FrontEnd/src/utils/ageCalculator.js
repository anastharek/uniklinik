function calculateAge(birthday) { // birthday is a date
    try{
    var ageDifMs = Date.now() - birthday;
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    let age= Math.abs(ageDate.getUTCFullYear() - 1970) 
    if(isNaN(age)){
        return "NA"
    }
    return age +" Yrs";
    }
    catch{
        return "NA"
    }
 }

 export default calculateAge;