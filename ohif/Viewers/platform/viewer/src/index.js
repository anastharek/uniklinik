/**
 * Entry point for development and production PWA builds.
 * Packaged (NPM) builds go through `index-umd.js`
 */

 import 'regenerator-runtime/runtime';

 import App from './App.js';
 import React from 'react';
 import ReactDOM from 'react-dom';
 // test

 /**
  * EXTENSIONS
  * =================
  *
  * Importing and modifying the extensions our app uses HERE allows us to leverage
  * tree shaking and a few other niceties. However, by including them here they become
  * "baked in" to the published application.
  *
  * Depending on your use case/needs, you may want to consider not adding any extensions
  * by default HERE, and instead provide them via the extensions configuration key or
  * by using the exported `App` component, and passing in your extensions as props using
  * the defaultExtensions property.
  */
 import OHIFVTKExtension from '@ohif/extension-vtk';
 import OHIFDicomHtmlExtension from '@ohif/extension-dicom-html';
 import OHIFDicomSegmentationExtension from '@ohif/extension-dicom-segmentation';
 import OHIFDicomRtExtension from '@ohif/extension-dicom-rt';
 import OHIFDicomMicroscopyExtension from '@ohif/extension-dicom-microscopy';
 import OHIFDicomPDFExtension from '@ohif/extension-dicom-pdf';
 import OHIFDicomModelPredictionExtension from '../../../extensions/ohif_dicom_ai_model_prediction-master';
 //import OHIFDicomTagBrowserExtension from '@ohif/extension-dicom-tag-browser';
 // Add this for Debugging purposes:
 //import OHIFDebuggingExtension from '@ohif/extension-debugging';
 import { version } from '../package.json';

 /*
  * Default Settings
  */
 let config = {};

 if (window) {
   config = window.config || {};
   window.version = version;
 }

 const appProps = {
   config,
   defaultExtensions: [
     OHIFVTKExtension,
     OHIFDicomHtmlExtension,
     OHIFDicomMicroscopyExtension,
     OHIFDicomPDFExtension,
     OHIFDicomSegmentationExtension,
     OHIFDicomRtExtension,
     [
       OHIFDicomModelPredictionExtension,
       {
         options: {
           mailTo: 'anastharek@gmail.com',
         },
         modelsDetails: [
          {
             //tukar
             id: '1',
             name: 'MRI Stroke A.I Module',
             predictionApi: '#',
             infoApi: '#',
             items: [
               {
                 id: '2',
                 name: 'Naim & Fandi DWI hemorrhage classification',
                 predictionApi: 'https://dwibleeddetection.padimedical.com/image',
                 infoApi: 'https://dwibleeddetection.padimedical.com/info',
               },
               /*{
                 id: '3',
                 name: 'Naim & Fandi DWI hemorrhage detection',
                 predictionApi:
                   'https://dwibleedob.padimedical.com/image',
                 infoApi:
                   'https://dwibleedob.padimedical.com/info',
               },*/
               {
                 id: '9',
                 name: 'Naim & Fandi DWI hemorrhage detection',
                 predictionApi:
                   'https://aidwibleedob.padimedical.com/image',
                 infoApi:
                   'https://aidwibleedob.padimedical.com/info',
               },
             ],
           },
           {
             //tukar
             id: '2',
             name: 'Opthalmology A.I Module',
             predictionApi: '#',
             infoApi: '#',
             items: [
               {
                 id: '3',
                 name: 'Diabetic retinopathy classification',
                 predictionApi: 'https://dropthal.padimedical.com/image',
                 infoApi: 'https://dropthal.padimedical.com/info',
               },
             ],
           },
           {
             //tukar
             id: '4',
             name: 'Pathology A.I Module',
             predictionApi: '#',
             infoApi: '#',
             items: [
               {
                 id: '5',
                 name: 'Breast cancer HPE classification',
                 predictionApi: 'https://idcbreast.padimedical.com/image',
                 infoApi: 'https://idcbreast.padimedical.com/info',
               },
             ],
           },
           {
             id: '6',
             name: 'Chest X-ray A.I Module',
             predictionApi: '#',
             infoApi: '#',
             items: [
               {
                 id: '7',
                 name: 'Chest x-ray triage',
                 predictionApi: 'https://aitest03.padimedical.com/image',
                 infoApi: 'https://aitest03.padimedical.com/info',
               },
               {
                 id: '21',
                 name: 'Pulmunary TB chest x-ray detection',
                 predictionApi:
                   'https://pulmunarytbcxr.padimedical.com/image',
                 infoApi:
                   'https://pulmunarytbcxr.padimedical.com/info',
               },
               /*{
                 id: '22',
                 name: 'Cardiomegaly detection',
                 predictionApi:
                   'https://aitest05.padimedical.com/image',
                 infoApi:
                   'https://aitest05.padimedical.com/info',
               },
               {
                 id: '23',
                 name: 'Lung pathology detection',
                 predictionApi:
                   'https://aipleuraleffusion01.padimedical.com/image',
                 infoApi:
                   'https://aipleuraleffusion01.padimedical.com/info',
               },*/
               {
                 id: '24',
                 name: 'Covid-19 detection',
                 predictionApi:
                   'https://covid19final.padimedical.com/image',
                 infoApi:
                   'https://covid19final.padimedical.com/info',
               },
             ],
           },
           
           {
             
             id: '8',
             name: 'Prostate Cancer detection',
             predictionApi: 'https://aiprostatedetection.padimedical.com/image',
             infoApi: 'https://aiprostatedetection.padimedical.com/info',
           
          
           },
         ],
       },
     ],

     //OHIFDebuggingExtension,
     // OHIFDicomTagBrowserExtension,
   ],
 };

 /** Create App */
 const app = React.createElement(App, appProps, null);

 /** Render */
 ReactDOM.render(app, document.getElementById('root'));
