import { volumeLoader, metaData } from '@cornerstonejs/core';
import {
  cornerstoneStreamingImageVolumeLoader,
  cornerstoneStreamingDynamicImageVolumeLoader,
} from '@cornerstonejs/core/loaders';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';
import { errorHandler, utils } from '@ohif/core';

const { registerVolumeLoader } = volumeLoader;

// Angiography modalities (XA/XRF/XAR) used to be stored as a SINGLE huge
// uncompressed multi-frame object per run (up to 1.3GB). Requesting JPEG-LS
// made Orthanc transcode the whole object on the fly — the first frame took
// ~60s+ before a single byte was sent. Since the PUTRACNS preload service
// now warms the JPEG-LS transcode for XA in the background (one full-object
// transcode per run, then cached), the viewer requests JPEG-LS for XA too:
// first view hits the warm cache (~0.2s), later frames are 3.2x smaller
// (634KB vs 2MB raw at 1024x1024x16-bit).
const RAW_FRAME_MODALITIES = [];

export default function initWADOImageLoader(
  userAuthenticationService,
  appConfig,
  extensionManager
) {
  registerVolumeLoader('cornerstoneStreamingImageVolume', cornerstoneStreamingImageVolumeLoader);

  registerVolumeLoader(
    'cornerstoneStreamingDynamicImageVolume',
    cornerstoneStreamingDynamicImageVolumeLoader
  );

  dicomImageLoader.init({
    maxWebWorkers: Math.min(
      Math.max(navigator.hardwareConcurrency - 1, 1),
      appConfig.maxNumberOfWebWorkers
    ),
    beforeSend: function (xhr, imageId, defaultHeaders, params) {
      //TODO should be removed in the future and request emitted by DicomWebDataSource
      const sourceConfig = extensionManager.getActiveDataSource()?.[0].getConfig() ?? {};
      const headers = userAuthenticationService.getAuthorizationHeader();

      let requestTransferSyntaxUID = sourceConfig.requestTransferSyntaxUID;
      if (imageId) {
        try {
          const series = metaData.get('generalSeriesModule', imageId);
          if (series && RAW_FRAME_MODALITIES.includes(series.modality)) {
            // raw frames — see RAW_FRAME_MODALITIES comment above
            requestTransferSyntaxUID = undefined;
          }
        } catch (e) {
          // metadata not available yet — keep the configured transfer syntax
        }
      }

      const acceptHeader = utils.generateAcceptHeader(
        sourceConfig.acceptHeader,
        requestTransferSyntaxUID,
        sourceConfig.omitQuotationForMultipartRequest
      );

      const xhrRequestHeaders = {
        Accept: acceptHeader,
      };

      if (headers) {
        Object.assign(xhrRequestHeaders, headers);
      }

      return xhrRequestHeaders;
    },
    errorInterceptor: error => {
      errorHandler.getHTTPErrorHandler(error);
    },
  });
}

export function destroy() {
  console.debug('Destroying WADO Image Loader');
}
