const classifier = knnClassifier.create();
const webcamElement = document.getElementById('webcam');
const classes = ['Alexa','Whats the time now?', 'what is the weather in Detroit?',
	  'What is your hobby?','Play a song']; 

var net;

async function app() {
  console.log('Loading mobilenet..');
  addStatusMg('Loading mobilenet..');

  // diable the predict button unless there is one trained class
  document.getElementById("predict").disabled = true;

  // Load the model.
  net = await mobilenet.load();
  console.log('Sucessfully loaded model');
  addStatusMg(`Sucessfully loaded model`);

  await setupWebcam();
  if (classifier.getNumClasses() == 0)
    addStatusMg(`First Train Signs and then make predictions`);
  

  // Reads an image from the webcam and associates it with a specific class
  // index.
  const addExample = async function (classId, id) {
    // Get the intermediate activation of MobileNet 'conv_preds' and pass that
    // to the KNN classifier.
    var count = 0;
    var retry = 0;
    while(count != 5 && retry != 20){
      const activation = net.infer(webcamElement, 'conv_preds');
      // Pass the intermediate activation to the classifier.
      classifier.addExample(activation, classId);      
      let prob = await getResult(activation);      
      console.log('probability: ' + prob['probability']);
      // console.log('predicted class: ' + prob['prediction']);
      
      if (prob['probability'] == 1)
        count += 1;
      retry += 1;
    }

    if (count == 5){
      document.getElementById("predict").disabled = false;
      document.getElementById(id).className = "btn btn-success";
      document.getElementById('txtInput').innerText = 
               `Training Complete for Sign + ${classId}`;
      
    }
   
  };

  // When clicking a button, add an example for that class.
  document.getElementById('class-a').addEventListener('click', () => addExample(0, 'class-a'));
  document.getElementById('class-b').addEventListener('click', () => addExample(1, 'class-b'));
  document.getElementById('class-c').addEventListener('click', () => addExample(2, 'class-c'));
  document.getElementById('class-d').addEventListener('click', () => addExample(3, 'class-d'));
  document.getElementById('class-e').addEventListener('click', () => addExample(4, 'class-e'));
  document.getElementById('predict').addEventListener('click', () => predictSign());
  // document.getElementById('save').addEventListener('click', () => saveModel());

  const saveModel = async function(){
    const saveResult = await classifier.save('localstorage://signs-model-trained');
    console.log(saveResult);    

  }

  const getResult = async function(activation){

    const result = await classifier.predictClass(activation);  
        
    /* call text box input from front end and store in const classes*/

    addStatusMg( `${classes[result.classIndex]}`,
                  'txtInput');    

    /*addStatusMg( `Prediction: ${classes[result.classIndex]}\n
                   Probability: ${result.confidences[result.classIndex]}`,
                  'txtInput');    
                  */
    
    res = { 'prediction' : result.classIndex,
            'probability' : result.confidences[result.classIndex] };
                  
    return res;
      // document.getElementById('txtInput').innerHTML=`${classes[result.classIndex]}`;
  }

  const predictSign =  function() {
    console.log('In Prediction function');

    var sentence="";
    
    let predictFunc = async function(){

      if (classifier.getNumClasses() > 0) {
        // Get the activation from mobilenet from the webcam.
        const activation = net.infer(webcamElement, 'conv_preds');
        // Get the most likely class and confidences from the classifier module.
      
        let res = await getResult(activation);

        // console.log('probability: ' + res['probability']);
        // console.log('predicted class: ' + classes[res['prediction']] + '\n\n');
        
        if (sentence == "" && classes[res['prediction']] == "Alexa"){
          sentence = sentence.concat('Alexa');
          addStatusMg(`Alexa`);
          console.log(sentence);
        }
        else if (sentence == "Alexa" && classes[res['prediction']] != "Alexa"){
          addStatusMg(`Alexa  ,  `+ `${classes[res['prediction']]}`);
          sentence = sentence.concat("  " + classes[res['prediction']]);
          console.log(sentence);
          document.getElementById("btnSpeak").click();
          sentence = '';
        }

    }

    }

    setInterval(predictFunc, 2500);   

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