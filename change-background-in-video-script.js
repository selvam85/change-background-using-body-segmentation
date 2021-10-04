let video = document.getElementById("webcam");
let webcamCanvas = document.getElementById("canvas");
let webcamCanvasCtx = webcamCanvas.getContext('2d');

//In Memory Canvas used for model prediction
var tempCanvas = document.createElement('canvas');
var tempCanvasCtx = tempCanvas.getContext('2d');

let previousSegmentationComplete = true;

let segmentationProperties = {
    segmentationThreshold: 0.7,
    internalResolution: 'full'
}

var model;
bodyPix.load().then(function (loadedModel) {
  model = loadedModel;
});

function main() {
    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({video: true})
            .then(stream => {
                video.srcObject = stream;
            })
            .catch(e => {
                console.log("Error occurred while getting the video stream");
            });
    }
    
    video.onloadedmetadata = () => {
        webcamCanvas.width = video.videoWidth;
        webcamCanvas.height = video.videoHeight;
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
    };
    
    video.addEventListener("loadeddata", segmentPersons);
}

function segmentPersons() {
    tempCanvasCtx.drawImage(video, 0, 0);
    if (previousSegmentationComplete) {
        previousSegmentationComplete = false;
        // Now classify the canvas image we have available.
        model.segmentPerson(tempCanvas, segmentationProperties)
            .then(segmentation => {
                    processSegmentation(segmentation);
                    previousSegmentationComplete = true;
            });
    }
    //Call this function repeatedly to perform segmentation on all frames of the video.
    window.requestAnimationFrame(segmentPersons);
}

function processSegmentation(segmentation) {
    var imgData = tempCanvasCtx.getImageData(0, 0, webcamCanvas.width, webcamCanvas.height);
    //Loop through the pixels in the image
    for(let i = 0; i < imgData.data.length; i+=4) {
        let pixelIndex = i/4;
        //Make the pixel transparent if it does not belong to a person using the body-pix model's output data array.
        //This removes all pixels corresponding to the background.
        if(segmentation.data[pixelIndex] == 0) {
          imgData.data[i + 3] = 0;
        }
      }
      //Draw the updated image on the canvas
      webcamCanvasCtx.putImageData(imgData, 0, 0);
}

main();