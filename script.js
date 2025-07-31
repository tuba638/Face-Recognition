const imageUpload = document.getElementById('imageUpload');

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
  const container = document.createElement('div');
  container.style.position = 'relative';
  document.body.append(container);
  const labeledFaceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
  let image;
  let canvas;
  document.body.append('Loaded');
  imageUpload.addEventListener('change', async () => {
    if (image) image.remove();
    if (canvas) canvas.remove();
    image = await faceapi.bufferToImage(imageUpload.files[0]);
    container.append(image);
    canvas = faceapi.createCanvasFromMedia(image);
    container.append(canvas);
    const displaySize = { width: image.width, height: image.height };
    faceapi.matchDimensions(canvas, displaySize);
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
      drawBox.draw(canvas);
    })

    //attendance
    attendance(results);

  })
}

function loadLabeledImages() {
  const labels = ['Harry Potter', 'Hermione Granger', 'Ron Weasley'];
  return Promise.all(
    labels.map(async label => {
      const descriptions = [];
      for (let i = 1; i <= 5; i++) {

        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/tuba638/Face-Recognition/main/labelled_images/${encodeURIComponent(label)}/${i}.jpg`);

        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

        //check
        if (!detections) {
          console.log(`No face detected in ${label}/${i}.jpg`);
          continue;
        }

        descriptions.push(detections.descriptor);
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  )
}

function attendance(results){
  const labels = ['Harry Potter', 'Hermione Granger', 'Ron Weasley']
  let present = [];
  let absent = [];

  results.forEach((result, i) =>{
    // console.log(`Detected face ${i} is matched to: ${result.label}`)
    present.push(result.label);
  })

  // Get absentees: those in labels but not in present
  absent = labels.filter(label => !present.includes(label));

  console.log("Present:", present);
  console.log("Absent:", absent);

  //print attendees
  const container1 = document.createElement('div');
  container1.style.position = 'relative';
  container1.id = 'present';
  const heading1 = document.createElement('h3');
  heading1.textContent = 'Present:';
  container1.appendChild(heading1);

  const ul1 = document.createElement('ul');
  present.forEach((person, i) =>{
    const li = document.createElement('li');
    li.textContent = person;
    ul1.appendChild(li);
  })
  container1.appendChild(ul1);
  document.body.appendChild(container1);

  //print absentees
  const container2 = document.createElement('div');
  container2.style.position = 'relative';
  container2.id = 'absent';
  const heading2 = document.createElement('h3');
  heading2.textContent = 'Absent:';
  container2.appendChild(heading2);

  const ul2 = document.createElement('ul');
  absent.forEach((person, i) =>{
    const li = document.createElement('li');
    li.textContent = person;
    ul2.appendChild(li);
  })
  container2.appendChild(ul2);
  document.body.appendChild(container2);

}

