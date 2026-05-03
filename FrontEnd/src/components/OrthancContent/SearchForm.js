import React, { Component } from 'react'
import Form from '../CommonComponents/SearchForm/Form'
import { connect } from 'react-redux'
import { empty_row, clickRow } from '../../actions/PadiMedical'

class SearchForm extends Component {

    dataSearch = (formData) => {

        //dateForm
        let date = ""
        if (formData.dateFrom !== "" || formData.dateTo !== "") //if dateFrom or dateTo isn't empty 
            date = formData.dateFrom.replace('-', '').replace('-', '') + '-' + formData.dateTo.replace('-', '').replace('-', '')
        //patient name
        let patientName = ""
        if (formData.lastName !== '' && formData.firstName === '')
            patientName = formData.lastName
        else if (formData.lastName === '' && formData.firstName !== '')
            patientName = '^' + formData.firstName
        else if (formData.lastName !== '' && formData.firstName !== '')
            patientName = formData.lastName + '^' + formData.firstName

        let contentSearch = {
            Level: 'Study',
            CaseSensitive: false,
            Expand: true,
            Query: {
                PatientName: patientName,
                PatientID: formData.patientID,
                AccessionNumber: formData.accessionNumber,
                StudyDate: date,
                ModalitiesInStudy: formData.modalities,
                StudyDescription: formData.studyDescription,
                ReferringPhysicianName:formData.ReferringPhysicianName,
                InstitutionName:formData.InstitutionName,
                
            }
        }

        //Call submit function to be handled by parent
        this.props.onSubmit(contentSearch)
        //this.reset_search();


    }

    reset_search = () => {
        this.props?.clicked_row?.map((element, index) => {
            let HTMLelement = document.getElementById(element);
            //  console.log("HTML ELE", HTMLelement)
            if (HTMLelement) {
                setTimeout(() => {
                    let name = HTMLelement.getElementsByTagName('span')[1]
                    //  console.log("name", name)
                    name && name.click();
                }, [index * 100])

            }
        })


    }

    //form
    render() {
        return (
            <Form title="Search" icone="fas fa-search" onFormValidate={this.dataSearch} >
                <input type='button' className='btn otjs-button otjs-button-blue' value='Search' />
            </Form>
        )
    }
}


const mapStatetoProp = state => {
    return { clicked_row: state.PadiMedical.clicked_row }
}
export default connect(mapStatetoProp, null)(SearchForm)