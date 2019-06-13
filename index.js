const classifier = knnClassifier.create();
const webcamElement = document.getElementById('webcam');
const classes = ['Alexa','What is the time', 'what is the weather in vishakhapatnam',
	  'What is your hobby.','Play Music']; 

let net;

async function app() {
  console.log('Loading mobilenet..');
  addStatusMg('Loading mobilenet..');

  // Load the model.
  net = await mobilenet.load();
  console.log('Sucessfully loaded model');
  addStatusMg(`Sucessfully loaded model`);

  await setupWebcam();
  if (classifier.getNumClasses() == 0)
    addStatusMg(`Train Signs first and then make predictions`);
  

  // Reads an image from the webcam and associates it with a specific class
  // index.
  const addExample = async function (classId) {
    // Get the intermediate activation of MobileNet 'conv_preds' and pass that
    // to the KNN classifier.
    var count = 0;
    while(count != 5){
      const activation = net.infer(webcamElement, 'conv_preds');
      // Pass the intermediate activation to the classifier.
      classifier.addExample(activation, classId);
      let prob = await getResult(activation);      
      console.log('probability: ' + prob);
      
      if (prob == 1)
        count += 1;
    }
    document.getElementById('txtInput').innerText = `
          Training Complete for Sign + ${classId}
        `;
    
  };

  // When clicking a button, add an example for that class.
  document.getElementById('class-a').addEventListener('click', () => addExample(0));
  document.getElementById('class-b').addEventListener('click', () => addExample(1));
  document.getElementById('class-c').addEventListener('click', () => addExample(2));
  document.getElementById('class-d').addEventListener('click', () => addExample(3));
  document.getElementById('class-e').addEventListener('click', () => addExample(4));
  document.getElementById('predict').addEventListener('click', () => predictSign());
  document.getElementById('save').addEventListener('click', () => saveModel());

  const saveModel = async function(){
    const saveResult = await classifier.save('localstorage://signs-model-trained');
    console.log(saveResult);    

  }

  const getResult = async function(activation){

    const result = await classifier.predictClass(activation);  
        
    /* call text box input from front end and store in const classes*/

    addStatusMg( `Prediction: ${classes[result.classIndex]}\n
                  Probability: ${result.confidences[result.classIndex]}`,
                  'txtInput');                  
    return result.confidences[result.classIndex];
      // document.getElementById('txtInput').innerHTML=`${classes[result.classIndex]}`;
  }

  const predictSign = async function() {
    console.log('In Prediction function');
    
    while (true) {
      if (classifier.getNumClasses() > 0) {
        // Get the activation from mobilenet from the webcam.
        const activation = net.infer(webcamElement, 'conv_preds');
        // Get the most likely class and confidences from the classifier module.
      
        getResult(activation);

        /*our own text to speech code*/
        
        /*var Textb = $('#txtInput');
        Textb.val(prediction);
    
        Textb.on('input', function() {
          prediction = $(this).val();
        })
        */
    }
  
      await tf.nextFrame();
    }

  }

}

const addStatusMg = function(msg, elementId = 'txtInput'){

  document.getElementById(elementId).innerText = msg;

}

async function setupWebcam() {

  addStatusMg(`Setting up Webcam. Please make sure web cam is connected.`);
  
  return new Promise((resolve, reject) => {
    const navigatorAny = navigator;
    navigator.getUserMedia = navigator.getUserMedia ||
        navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
        navigatorAny.msGetUserMedia;
    if (navigator.getUserMedia) {
      navigator.getUserMedia({video: true},
        stream => {
          webcamElement.srcObject = stream;
          webcamElement.addEventListener('loadeddata',  () => resolve(), false);
        },
        error => reject());
    } else {
      reject();
    }
  });
}

app();