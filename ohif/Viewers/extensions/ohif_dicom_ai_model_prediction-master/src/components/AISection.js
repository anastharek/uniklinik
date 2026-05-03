import React, { Component } from 'react';
import stateDetails from '../state';
import cornerstone from 'cornerstone-core';
//import cornerstoneTools from 'cornerstone-tools';
import cornerstoneTools from 'cornerstone-tools';
//import * as cornerstoneTools from 'cornerstone-tools';
import Drawing from 'cornerstone-tools';
import NestedSelect from 'nested-select';
const drawTextBox = cornerstoneTools.importInternal('drawing/drawTextBox');
const getNewContext = cornerstoneTools.import('drawing/getNewContext');

class AISection extends Component {
  state = {
    name: '',
    modality: '',
    organ: '',
    task: '',
    data_description: '',
    model_description: '',
    additional_info: '',
    model_performance: '',
    website: '',
    citation: '',
    version: '',
    modelsDetails: [],
    allModelItems:null
  };

  dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI
      .split(',')[0]
      .split(':')[1]
      .split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var arrayBuffer = new ArrayBuffer(byteString.length);
    var _ia = new Uint8Array(arrayBuffer);
    for (var i = 0; i < byteString.length; i++) {
      _ia[i] = byteString.charCodeAt(i);
    }

    var dataView = new DataView(arrayBuffer);
    var blob = new Blob([dataView], { type: mimeString });
    return blob;
  }

  handleChange = event => {
    console.log("P vent",event)
    const value = event.P;
    if(!value)return;
    if(this.state.allModelItems==null){
      let temp=[]
      stateDetails.modelsDetails.map(element=>{
        if(element.items){
          element.items.map(obj=>temp.push(obj));
          return;
        }
        temp.push(element);
      })
      this.state.allModelItems=temp
    }
    var found = this.state.allModelItems.filter(function (data) {
      return data.id === value;
    });
    const endpoint = `${found[0].infoApi}?model_id=${value}`;

    fetch(endpoint)
      .then(response => response.json())
      .then(data => {
        const value_params = data.data;

        this.setState({
          name: value_params.name,
          modality: value_params.modality,
          organ: value_params.organ,
          task: value_params.task,
          data_description: value_params.data_description,
          model_description: value_params.model_description,
          additional_info: value_params.additional_info,
          model_performance: value_params.model_performance,
          website: value_params.website,
          citation: value_params.citation,
          version: value_params.version,
        });
      });
  };

  handlePredictionClick = event => {
    event.preventDefault();

    const { UINotificationService } = this.props.servicesManager.services;

    const input = { value: this.state.model_id };
    const modelId = input.value;
    var found = this.state.allModelItems.filter(function (data) {
      return data.id === input.value;
    });

    const endpoint = `${found[0].predictionApi}`;
    const activeEnabledElement = cornerstone.getEnabledElements()[0];
    //console.log('active screnn', activeEnabledElement);
    //console.log('all screnn', cornerstone.getEnabledElements());
    const formData = new FormData();
    let imageBlob = null;
    if (typeof activeEnabledElement.image.getCanvas === 'function') {
      imageBlob = this.dataURItoBlob(
        activeEnabledElement.image.getCanvas().toDataURL()
      );
    } else {
      imageBlob = this.dataURItoBlob(activeEnabledElement.canvas.toDataURL());
    }
    // console.log(imageBlob);
    formData.append('image', imageBlob);
    formData.append('modelId', modelId);
    formData.append('rows', activeEnabledElement.image.rows);
    formData.append('columns', activeEnabledElement.image.columns);

    const requestOptions = {
      method: 'POST',
      body: formData,
    };

    const pendingNotificationId = UINotificationService.show({
      title: 'Pending',
      message: 'Trying to process the request',
      position: 'bottomLeft',
    });

    fetch(endpoint, requestOptions)
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.predictions[0]) {
          stateDetails.predictionResults = responseJson.predictions.map(
            element => element.data.attributes
          );
          console.log("prediction resu",stateDetails.predictionResults)
          //console.log(responseJson.predictions.data.attributes);
          if (responseJson.predictions.length != 0) {
            stateDetails.sectionResults = responseJson.predictions;
          } else {
            stateDetails.sectionResults = [];
          }

          let canvas1 = document.querySelector('.cornerstone-canvas');
          stateDetails.sectionResults.map(function (sectionItem) {
            if (
              sectionItem.data.sections[0].start &&
              sectionItem.data.sections[0].end
            ) {
              this.drawRect(
                sectionItem.data.sections[0].start,
                sectionItem.data.sections[0].end,
                sectionItem.data.attributes[0].description,
                (sectionItem.data.attributes[1].description * 100).toFixed(2)
              );
            }
          }, this);
          document.getElementsByClassName('tab-list-item  results-section')[0].click();
          UINotificationService.show({
            title: 'Success',
            message: 'Successfully gained prediction results!!!',
            position: 'bottomLeft',
            duration: 4000,
            type: 'success',
          });
        }
        else if(responseJson.predictions.data){
          stateDetails.predictionResults = [responseJson.predictions.data.attributes];
          document.getElementsByClassName('tab-list-item  results-section')[0].click();
          UINotificationService.show({
            title: 'Success',
            message: 'Successfully gained prediction results!!!',
            position: 'bottomLeft',
            duration: 4000,
            type: 'success',
          });
        }
        else {
          UINotificationService.show({
            title: 'Not Detected',
            message: 'Unable to find requested detection !!',
            position: 'bottomLeft',
            duration: 4000,
            type: 'warning',
          });
        }

        UINotificationService.hide({ pendingNotificationId });
      })
      .catch(error => {
        return console.log(error);
      });
  };

  drawRect(start_data, end_data, text, percent) {
    const activeEnabledElement = cornerstone.getEnabledElements()[0];

    if (!activeEnabledElement) {
      return;
    }

    const element = activeEnabledElement.element;

    var start = {
      x: start_data.x,
      y: start_data.y,
    };
    var end = {
      x: start_data.x + end_data.x,
      y: start.y + end_data.y,
    };

    const measurementData = {
      visible: true,
      active: true,
      invalidated: true,
      handles: {
        start: {
          x: start.x,
          y: start.y,
          highlight: true,
          active: false,
        },
        end: {
          x: end.x,
          y: end.y,
          highlight: true,
          active: true,
        },
        textBox: {
          active: false,
          hasMoved: false,
          movesIndependently: false,
          drawnIndependently: true,
          allowedOutsideImage: true,
          hasBoundingBox: true,
        },
      },
    };

    // cornerstoneTools.clearToolState(element, 'RectangleRoi');
    // const toolData = cornerstoneTools.getToolState(element, 'rectangleRoi');
    // console.log(toolData)
    const context = activeEnabledElement.canvas.getContext('2d');
    cornerstoneTools.addToolState(element, 'RectangleRoi', measurementData, {
      configuration: {
        hideTextBox: true,
      },
    });
    //console.log('toold', cornerstoneTools);
    //console.log('drawing=>', BaseTool);
    // console.log('toold2', cornerstoneTools2);
    //const context = getNewContext(activeEnabledElement.canvas);
    //console.log(drawTextBox);
    setTimeout(() => {
      drawTextBox(
        context,
        text + ` ${percent}%`,
        start.x,
        start.y - 20,
        'gold'
      );
      context.save();
    }, 1000);
  }

  componentDidMount() {
    const input = document.getElementById('model-selection');
    var found = stateDetails.modelsDetails.filter(function (data) {
      return data.id === input.value;
    });

    const endpoint = `${found[0].infoApi}?model_id=${input.value}`;

    fetch(endpoint)
      .then(response => response.json())
      .then(data => {
        const value_params = data.data;

        this.setState({
          name: value_params.name,
          modality: value_params.modality,
          organ: value_params.organ,
          task: value_params.task,
          data_description: value_params.data_description,
          model_description: value_params.model_description,
          additional_info: value_params.additional_info,
          model_performance: value_params.model_performance,
          website: value_params.website,
          citation: value_params.citation,
          version: value_params.version,
        });
      });
  }

  render() {
    const optionItems = stateDetails.modelsDetails.map(
      ({ id, name, predictionApi, infoApi }) => (
        // eslint-disable-next-line react/jsx-key
        <option value={id}>{name}</option>
      )
    );
    return (
      <div id="ai-section-wrapper" className="">
        <form>
          <div className="form-group">
            <label className="form-label" htmlFor="ai-models">
              Selected Algorithm Model
            </label>
            <NestedSelect
              onSelect={e => {this.handleChange(e);this.setState({ model_id: e.P })}}
              options={stateDetails.modelsDetails.map(element => {
                return {
                  N: element.name,
                  P: element.id,
                  ...element,
                  H: element.items
                    ? element.items.map(ele => {
                      return { N: ele.name, P: ele.id };
                    })
                    : [],
                };
              })}
            />
            <select
              style={{ display: 'none' }}
              id="model-selection"
              className="form-control ai-models js-aiModelName js-option"
              onChange={e => this.handleChange(e)}
            >
              {optionItems}
            </select>

            <div className="ai-magic-button">
              <button
                onClick={this.handlePredictionClick}
                className="btn btn-sm"
              >
                ANALYZE
              </button>
            </div>
          </div>
        </form>
        <br />
        <p className="table-title">Algorithm Model Specifications</p>
        <div id="ai-model-info">
          <table className="table table-responsive">
            <tbody>
              <tr>
                <td className="text-bold">model name</td>
                <td>{this.state.name}</td>
              </tr>
              <tr>
                <td className="text-bold">organ</td>
                <td>{this.state.organ}</td>
              </tr>
              <tr>
                <td className="text-bold">modality</td>
                <td>{this.state.modality}</td>
              </tr>
              <tr>
                <td className="text-bold">task</td>
                <td>{this.state.task}</td>
              </tr>
              <tr>
                <td className="text-bold">data description</td>
                <td>{this.state.data_description}</td>
              </tr>
              <tr>
                <td className="text-bold">model description</td>
                <td>{this.state.model_description}</td>
              </tr>
              <tr>
                <td className="text-bold">disclaimer</td>
                <td>{this.state.additional_info}</td>
              </tr>
              <tr>
                <td className="text-bold">model performance</td>
                <td>{this.state.model_performance}</td>
              </tr>
              <tr>
                <td className="text-bold">website</td>
                <td>{this.state.website}</td>
              </tr>
              <tr>
                <td className="text-bold">citation</td>
                <td>{this.state.citation}</td>
              </tr>
              <tr>
                <td className="text-bold">version</td>
                <td>{this.state.version}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default AISection;
